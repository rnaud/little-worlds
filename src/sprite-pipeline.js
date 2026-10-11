// Native sprite preparation: cleanup, binary alpha and fixed palette.
export function surface(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}
export function bounds(data, w, h) {
  let left = w,
    top = h,
    right = -1,
    bottom = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > 96) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
  return right < 0
    ? null
    : { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
}
// Remove disconnected fragments from neighboring generated cells and stray marks.
export function keepMainComponent(ctx, w, h) {
  const image = ctx.getImageData(0, 0, w, h),
    d = image.data,
    seen = new Uint8Array(w * h),
    queue = new Int32Array(w * h);
  let largest = [];
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || d[i * 4 + 3] < 128) continue;
    let head = 0,
      tail = 1;
    queue[0] = i;
    seen[i] = 1;
    const component = [];
    while (head < tail) {
      const at = queue[head++];
      component.push(at);
      const x = at % w,
        y = Math.floor(at / w);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx,
            ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const next = ny * w + nx;
          if (!seen[next] && d[next * 4 + 3] >= 128) {
            seen[next] = 1;
            queue[tail++] = next;
          }
        }
    }
    if (component.length > largest.length) largest = component;
  }
  const keep = new Uint8Array(w * h);
  for (const i of largest) keep[i] = 1;
  for (let i = 0; i < w * h; i++) if (!keep[i]) d[i * 4 + 3] = 0;
  ctx.putImageData(image, 0, 0);
}
export function quantize(ctx, w, h, palette) {
  const img = ctx.getImageData(0, 0, w, h),
    d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) {
      d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0;
      continue;
    }
    let best = Infinity,
      c = palette[0];
    for (const p of palette) {
      const distance =
        (p[0] - d[i]) ** 2 + (p[1] - d[i + 1]) ** 2 + (p[2] - d[i + 2]) ** 2;
      if (distance < best) {
        best = distance;
        c = p;
      }
    }
    d.set([...c, 255], i);
  }
  ctx.putImageData(img, 0, 0);
}
