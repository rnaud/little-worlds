// Native scenery. Every primitive writes integer pixel cells; no image sampling.
const surface = () => {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 180;
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = false;
  return [c, x];
};
function pen(ctx) {
  const r = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const oval = (x, y, rx, ry, c) => {
    for (let yy = -ry; yy <= ry; yy++) {
      const half = Math.floor(
        rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))),
      );
      r(x - half, y + yy, half * 2 + 1, 1, c);
    }
  };
  const line = (x, y, tx, ty, c) => {
    x = Math.round(x);
    y = Math.round(y);
    tx = Math.round(tx);
    ty = Math.round(ty);
    const dx = Math.abs(tx - x),
      sx = x < tx ? 1 : -1,
      dy = -Math.abs(ty - y),
      sy = y < ty ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      r(x, y, 1, 1, c);
      if (x === tx && y === ty) break;
      const e = 2 * err;
      if (e >= dy) {
        err += dy;
        x += sx;
      }
      if (e <= dx) {
        err += dx;
        y += sy;
      }
    }
  };
  return { r, oval, line };
}
export function nativeLayers(id) {
  const out = [];
  for (let layer = 0; layer < 3; layer++) {
    const [c, ctx] = surface(),
      { r, oval, line } = pen(ctx);
    if (id === "summit") {
      if (layer === 0) {
        r(0, 0, 320, 180, "#a4becd");
        r(0, 78, 320, 102, "#b6cbd5");
        r(0, 128, 320, 52, "#c6d6d8");
        for (const [x, y] of [
          [43, 36],
          [205, 21],
          [286, 57],
        ]) {
          oval(x, y, 22, 4, "#d5e0dc");
          oval(x - 8, y - 3, 10, 5, "#d5e0dc");
          oval(x + 8, y - 2, 8, 4, "#d5e0dc");
        }
      }
      if (layer === 1) {
        for (const [x, top, half] of [
          [22, 91, 64],
          [103, 62, 83],
          [216, 82, 79],
          [302, 58, 73],
        ])
          for (let y = top; y < 180; y++) {
            const span = Math.min(half, Math.floor((y - top) * 0.8));
            r(x - span, y, span * 2 + 1, 1, "#8da8bb");
            if (y < top + 24) r(x - span, y, span + 1, 1, "#d0dfe1");
            else if (y < top + 31)
              r(x - span, y, Math.max(1, span - 6), 1, "#b3cad4");
            else r(x - span, y, span, 1, "#9cb6c5");
          }
      }
      if (layer === 2) {
        for (const [x, top, half] of [
          [-20, 147, 81],
          [100, 158, 84],
          [245, 132, 92],
          [330, 151, 75],
        ])
          for (let y = top; y < 180; y++) {
            const span = Math.min(half, (y - top) * 2);
            r(x - span, y, span * 2 + 1, 1, "#718ea6");
            r(x - span, y, span, 1, "#7e9aaf");
          }
        for (const x of [12, 37, 68, 265, 289, 310]) {
          const y = 157 + (x % 7);
          r(x, y, 2, 25, "#647f99");
          for (let n = 0; n < 4; n++)
            r(x - 2 - n, y + n * 4, 6 + n * 2, 3, "#6a88a0");
        }
      }
    } else {
      if (layer === 0) {
        r(0, 0, 320, 180, "#c5ddd5");
        r(0, 85, 320, 95, "#d4e4d7");
        for (const [x, y] of [
          [44, 33],
          [209, 20],
          [284, 65],
        ]) {
          oval(x, y, 25, 4, "#e8ebd8");
          oval(x - 7, y - 3, 12, 5, "#e8ebd8");
          oval(x + 8, y - 2, 9, 4, "#e8ebd8");
        }
      }
      if (layer === 1) {
        r(0, 133, 320, 47, "#9bbfba");
        for (const [x, top, half] of [
          [32, 118, 69],
          [159, 125, 72],
          [277, 109, 77],
        ])
          for (let y = top; y < 151; y++) {
            const span = Math.min(half, (y - top) * 3);
            r(x - span, y, span * 2 + 1, 1, "#a7c7bd");
          }
        for (let x = 0; x < 320; x += 35) r(x, 151 + (x % 7), 20, 1, "#bbd6c9");
      }
      if (layer === 2) {
        for (const [x, top, half] of [
          [-10, 149, 65],
          [143, 167, 53],
          [286, 150, 71],
        ])
          for (let y = top; y < 180; y++) {
            const span = Math.min(half, (y - top) * 3);
            r(x - span, y, span * 2 + 1, 1, "#81a99b");
          }
        for (const [x, y] of [
          [21, 142],
          [291, 134],
        ]) {
          r(x, y, 2, 38, "#7b9e8c");
          for (const [dx, dy] of [
            [-12, -4],
            [-8, -9],
            [7, -9],
            [12, -3],
          ]) {
            line(x, y, x + dx, y + dy, "#7b9e8c");
            line(x, y + 1, x + dx, y + dy + 1, "#7b9e8c");
          }
        }
      }
    }
    out.push(c);
  }
  return out;
}
export function nativeScene(id) {
  const [c, ctx] = surface(),
    { r, oval, line } = pen(ctx);
  if (id === "summit" || id === "meadow") {
    for (const layer of nativeLayers(id)) ctx.drawImage(layer, 0, 0);
    return c;
  }
  if (id === "forest") {
    r(0, 0, 320, 180, "#264b50");
    r(22, 23, 276, 139, "#2c5153");
    for (const [x, y] of [
      [31, 37],
      [270, 146],
      [243, 25],
      [60, 150],
      [159, 32],
      [181, 151],
    ]) {
      r(x, y, 3, 1, "#3e645e");
      r(x + 2, y - 2, 1, 3, "#3e645e");
      r(x + 5, y, 2, 1, "#3e645e");
    }
    for (let x = -12; x < 345; x += 38)
      for (const y of [-3, 180]) {
        oval(x, y, 26, 23, "#173b43");
        oval(x - 5, y - 7, 21, 16, "#21474a");
        oval(x - 8, y - 10, 12, 8, "#315b52");
      }
    for (let y = 20; y < 180; y += 43)
      for (const x of [-4, 323]) {
        oval(x, y, 20, 29, "#173b43");
        oval(x - 5, y - 7, 15, 19, "#21474a");
        r(x < 0 ? 8 : 309, y + 17, 3, 20, "#213e42");
        line(x < 0 ? 11 : 309, y + 32, x < 0 ? 20 : 300, y + 35, "#34564d");
      }
    for (const [x, y] of [
      [35, 22],
      [287, 74],
      [54, 164],
    ]) {
      r(x, y, 1, 2, "#8ba582");
      r(x + 4, y - 3, 1, 1, "#759b80");
    }
  } else if (id === "garden") {
    r(0, 0, 320, 180, "#b3a17c");
    r(22, 17, 276, 153, "#c4b18b");
    r(0, 160, 320, 20, "#a28d72");
    for (let x = 25; x < 320; x += 45) {
      r(x, 0, 3, 35, "#8e917b");
      r(x + 3, 0, 37, 27, "#a9bda7");
      r(x + 4, 1, 2, 24, "#c3d0b7");
      r(x + 3, 27, 37, 3, "#7d8877");
    }
    r(0, 31, 320, 3, "#918b6f");
    for (const x of [10, 293]) {
      r(x, 44, 15, 104, "#7e8d68");
      for (let y = 40; y < 149; y += 22) {
        oval(x + 5, y, 9, 10, "#718864");
        oval(x + 2, y - 3, 6, 5, "#95a77c");
        r(x + 11, y + 5, 3, 4, "#d0b071");
      }
    }
    for (let x = 30; x < 300; x += 36) r(x, 173, 18, 1, "#b3a17c");
  } else if (id === "bricks") {
    r(0, 0, 320, 180, "#1b263e");
    r(29, 18, 262, 150, "#202c43");
    for (const x of [10, 301]) {
      r(x, 15, 8, 143, "#344154");
      r(x + 1, 15, 2, 143, "#536064");
      r(x - 3, 12, 14, 4, "#756d61");
      r(x - 3, 159, 14, 4, "#756d61");
    }
    // The clock face is deliberately low-contrast, behind the clear flight area.
    for (let a = 0; a < 360; a++) {
      const t = (a * Math.PI) / 180,
        x = Math.round(160 + Math.cos(t) * 69),
        y = Math.round(91 + Math.sin(t) * 69);
      r(x, y, 1, 1, "#2f3b50");
    }
    for (let a = 0; a < 12; a++) {
      const t = (a * Math.PI) / 6;
      line(
        160 + Math.cos(t) * 62,
        91 + Math.sin(t) * 62,
        160 + Math.cos(t) * 66,
        91 + Math.sin(t) * 66,
        "#3a4555",
      );
    }
    line(160, 91, 177, 67, "#303f52");
    line(160, 91, 145, 83, "#303f52");
    r(18, 172, 284, 2, "#706957");
    r(21, 175, 278, 1, "#3a4555");
  } else if (id === "space") {
    r(0, 0, 320, 180, "#1e2546");
    for (let y = 0; y < 180; y++) {
      const x = 260 - y;
      for (const [offset, col] of [
        [0, "#28294e"],
        [18, "#302e54"],
        [30, "#353159"],
      ])
        r(x + offset, y, 19, 1, col);
    }
    for (let n = 0; n < 34; n++) {
      const x = (n * 83 + 17) % 320,
        y = (n * 47 + 13) % 180;
      r(x, y, 1, 1, n % 3 ? "#63708b" : "#9b9bab");
      if (n % 11 === 0) {
        r(x - 1, y, 3, 1, "#7c8199");
        r(x, y - 1, 1, 3, "#7c8199");
      }
    }
    oval(264, 35, 32, 32, "#9c797c");
    oval(258, 30, 26, 25, "#be9290");
    oval(251, 22, 16, 12, "#cca79a");
    for (let a = 0; a < 360; a++) {
      const t = (a * Math.PI) / 180,
        xx = Math.cos(t) * 51,
        yy = Math.sin(t) * 11,
        x = Math.round(264 + xx * 0.93 - yy * 0.36),
        y = Math.round(35 + xx * 0.36 + yy * 0.93);
      if (y > 36 || x < 232 || x > 294) r(x, y, 1, 1, "#d0b798");
    }
  } else if (id === "rally") {
    r(0, 0, 320, 180, "#b9d9d8");
    r(0, 85, 320, 95, "#7fa595");
    r(0, 111, 320, 69, "#85bec5");
  }
  return c;
}
