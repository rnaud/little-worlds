// A nearest-neighbour map sampled once per native pixel, like a Mode 7 floor.
export const rallyRoad = (distance, y) =>
  480 + Math.sin(distance / 360 + y / 220) * 85;
const MAP_SIZE = 512,
  WORLD_SIZE = 3000;
let track;
const frames = new WeakMap();
export function rallyPose(distance) {
  const angle = (distance / 1800) * Math.PI * 2;
  const dx = -950 * Math.sin(angle),
    dy = 650 * Math.cos(angle);
  const length = Math.hypot(dx, dy);
  const fx = dx / length,
    fy = dy / length;
  return {
    x: 1500 + 950 * Math.cos(angle),
    y: 1500 + 650 * Math.sin(angle),
    fx,
    fy,
    rx: fy,
    ry: -fx,
  };
}
export function rallyCamera(distance, lane = 0) {
  const p = rallyPose(distance);
  return {
    ...p,
    x: p.x - p.fx * 140 + p.rx * lane * 0.2,
    y: p.y - p.fy * 140 + p.ry * lane * 0.2,
  };
}
export function projectRallyPoint(camera, x, y) {
  const dx = x - camera.x,
    dy = y - camera.y;
  const depth = dx * camera.fx + dy * camera.fy;
  const side = dx * camera.rx + dy * camera.ry;
  const safeDepth = Math.max(20, depth);
  return {
    x: 480 + (side * 210) / safeDepth,
    y: 174 + 37800 / safeDepth,
    scale: 210 / safeDepth,
    depth,
  };
}
export function projectRallyActor(distance, lane, x, y) {
  const p = rallyPose(distance + (424 - y) * 0.35);
  const offset = x - rallyRoad(distance, y);
  return projectRallyPoint(
    rallyCamera(distance, lane),
    p.x + p.rx * offset,
    p.y + p.ry * offset,
  );
}
function trackMap() {
  if (track) return track;
  const color = (hex) =>
    (0xff000000 |
      (parseInt(hex.slice(5, 7), 16) << 16) |
      (parseInt(hex.slice(3, 5), 16) << 8) |
      parseInt(hex.slice(1, 3), 16)) >>>
    0;
  const c = Object.fromEntries(
    Object.entries({
      grass: "#83a679",
      grass2: "#89ad7e",
      road: "#77808a",
      sand: "#dcc79b",
      white: "#fff0ce",
      red: "#c67365",
      dark: "#344354",
      sea: "#79b7c7",
      sea2: "#85c2cd",
    }).map(([key, hex]) => [key, color(hex)]),
  );
  track = new Uint32Array(MAP_SIZE * MAP_SIZE);
  for (let py = 0; py < MAP_SIZE; py++)
    for (let px = 0; px < MAP_SIZE; px++) {
      const dx = (px / MAP_SIZE) * WORLD_SIZE - 1500,
        dy = (py / MAP_SIZE) * WORLD_SIZE - 1500;
      const q = Math.hypot(dx / 950, dy / 650);
      const gradient = Math.hypot(
        dx / (950 * 950 * (q || 1)),
        dy / (650 * 650 * (q || 1)),
      );
      const edge = Math.abs((q - 1) / (gradient || 1));
      const angle = Math.atan2(dy / 650, dx / 950);
      let value = ((px >> 4) + (py >> 4)) % 2 ? c.grass : c.grass2;
      if (q < 0.57 || q > 1.57)
        value = ((px >> 3) + (py >> 3)) % 7 ? c.sea : c.sea2;
      if (edge < 205) value = c.sand;
      if (edge < 188)
        value = Math.floor((angle + Math.PI) * 22) % 2 ? c.red : c.white;
      if (edge < 173) {
        value = c.road;
        if (edge < 3 && Math.floor((angle + Math.PI) * 40) % 2) value = c.white;
        if (dx > 0 && Math.abs(dy) < 23)
          value =
            (Math.floor((dx + 2000) / 24) + Math.floor((dy + 24) / 12)) % 2
              ? c.dark
              : c.white;
      }
      track[py * MAP_SIZE + px] = value;
    }
  return track;
}
export function paintRallyRoad(ctx, distance = 0, lane = 0) {
  const rect = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  rect(0, 0, 320, 58, "#b9d9d8");
  rect(0, 32, 320, 26, "#d5e7d9");
  for (let y = 0; y < 17; y++)
    for (let x = 0; x < 17; x++)
      if ((x - 8) ** 2 + (y - 8) ** 2 <= 64)
        rect(252 + x, 17 + y, 1, 1, "#fff1bd");
  for (let x = 0; x < 320; x++) {
    const hill =
      10 +
      Math.round(
        5 * Math.sin((x + distance * 0.07) / 37) +
          3 * Math.sin((x + distance * 0.03) / 13),
      );
    rect(x, 58 - hill, 1, hill, "#89aaa3");
  }
  let frame = frames.get(ctx);
  if (!frame) {
    frame = ctx.createImageData(320, 122);
    frames.set(ctx, frame);
  }
  const data = new Uint32Array(frame.data.buffer),
    map = trackMap(),
    camera = rallyCamera(distance, lane);
  const mapScale = MAP_SIZE / WORLD_SIZE;
  for (let row = 0; row < 122; row++) {
    const depth = 12600 / (row + 0.5);
    const step = depth / 70;
    let wx = camera.x + camera.fx * depth - camera.rx * 160 * step;
    let wy = camera.y + camera.fy * depth - camera.ry * 160 * step;
    for (let x = 0; x < 320; x++) {
      const mx = Math.floor(wx * mapScale),
        my = Math.floor(wy * mapScale);
      data[row * 320 + x] =
        mx >= 0 && mx < MAP_SIZE && my >= 0 && my < MAP_SIZE
          ? map[my * MAP_SIZE + mx]
          : 0xffc7b779;
      wx += camera.rx * step;
      wy += camera.ry * step;
    }
  }
  ctx.putImageData(frame, 0, 58);
}
