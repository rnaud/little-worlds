import { PixelDrawing } from "./native-actors.js";
const P = {
  o: "#263047",
  j: "#43516a",
  h: "#718798",
  H: "#aec7c5",
  w: "#fff0ca",
  s: "#ecd69e",
  S: "#baa16e",
  g: "#3e765e",
  G: "#7eac78",
  l: "#b7d796",
  c: "#3d8393",
  C: "#75baca",
  a: "#b4e9df",
  t: "#b06259",
  T: "#e49a75",
  p: "#da86a0",
  b: "#915d86",
  y: "#f1cd68",
  Y: "#b48643",
  k: "#685247",
  K: "#a27d57",
};
export const NATIVE_OBJECT_SPECS = [
  ["beacon", 24, 32],
  ["goal-flag", 24, 32],
  ["bananas", 16, 16],
  ["cottage", 48, 40],
  ["amber-lantern", 14, 22],
  ["woodland-key", 14, 20],
  ["root-gate", 24, 28],
  ["shrine", 36, 36],
  ["seedling-pot", 16, 22],
  ["pink-pot", 18, 24],
  ["gold-pot", 20, 24],
  ["hedge", 24, 16],
  ["festival-drum", 24, 26],
  ["festival-lantern", 16, 28],
  ["brass-paddle", 48, 16],
  ["clockwork-gem", 16, 16],
  ...[
    "palm",
    "olive",
    "crystal",
    "succulent",
    "lotus",
    "fern",
    "gear",
    "lantern",
  ].map((id) => ["flora-" + id, 32, 40]),
  ["keepsake-ribbon", 24, 24],
  ["keepsake-seeds", 24, 24],
  ["keepsake-compass", 24, 24],
  ["dog-biscuit", 24, 16],
  ["flower-spring", 24, 24],
  ["leaf-ferry", 48, 16],
  ["picnic-basket", 32, 28],
  ["keepsake-album", 32, 24],
];
export function drawNativeObject(id, width, height) {
  const spec = NATIVE_OBJECT_SPECS.find((s) => s[0] === id);
  if (!spec) return null;
  const w = width || spec[1],
    h = height || spec[2],
    d = new PixelDrawing(w, h, P),
    cx = Math.floor(w / 2),
    bottom = h - 2;
  const rect = (x, y, ww, hh, col) =>
    d.rect(
      Math.round(x),
      Math.round(y),
      Math.max(1, Math.round(ww)),
      Math.max(1, Math.round(hh)),
      col,
    );
  const line = (x, y, xx, yy, col) =>
    d.line(Math.round(x), Math.round(y), Math.round(xx), Math.round(yy), col);
  const oval = (x, y, rx, ry, col) => {
    for (let yy = -ry; yy <= ry; yy++)
      for (let xx = -rx; xx <= rx; xx++)
        if ((xx * xx) / (rx * rx || 1) + (yy * yy) / (ry * ry || 1) <= 1)
          d.dot(Math.round(x + xx), Math.round(y + yy), col);
  };
  const gem = (x, y, r) => {
    for (let yy = -r; yy <= r; yy++) {
      const ww = Math.max(0, r - Math.abs(yy));
      rect(x - ww, y + yy, ww * 2 + 1, 1, "o");
      if (ww > 1) {
        rect(x - ww + 1, y + yy, ww - 1, 1, "C");
        rect(x, y + yy, ww, 1, "c");
      }
    }
    line(x, y - r + 2, x - 2, y, "a");
  };
  const pot = (color = "t") => {
    const pw = Math.max(7, w - 4),
      top = Math.max(8, h - 10);
    rect(cx - pw / 2, top, pw, 3, "o");
    rect(cx - pw / 2 + 1, top + 1, pw - 2, 2, "T");
    for (let yy = 3; yy < h - top - 1; yy++) {
      const inset = Math.floor(yy / 4);
      rect(cx - pw / 2 + inset, top + yy, pw - inset * 2, 1, "o");
      rect(cx - pw / 2 + inset + 1, top + yy, pw - inset * 2 - 2, 1, color);
    }
    rect(
      cx - pw / 2 + 3,
      top + 4,
      2,
      Math.max(1, h - top - 7),
      color === "Y" ? "y" : "T",
    );
  };
  if (id === "bananas" && (w < 8 || h < 7)) {
    // Distance silhouette: a deliberate crescent, never a clipped large stencil.
    line(0, 0, 0, h - 2, "y");
    line(0, h - 2, Math.max(0, w - 2), h - 1, "y");
    line(w - 1, Math.floor(h / 2), w - 2, h - 1, "w");
  } else if (id === "bananas" && w < 14) {
    d.stamp(
      [
        "..o.....",
        "..yo....",
        "..ywo...",
        "..ywoyo.",
        "..ywwyo.",
        "...yyo..",
        "....o...",
      ],
      Math.max(0, cx - 4),
      Math.max(0, Math.floor((h - 7) / 2)),
    );
  } else if (id === "woodland-key" && w < 12) {
    d.stamp(
      [
        "..ooo...",
        ".oyyyo..",
        ".oyoYo..",
        "..oyo...",
        "..oyo...",
        "..oyyyo.",
        "..oyoyo.",
        "..oooo..",
      ],
      Math.max(0, cx - 4),
      Math.max(0, h - 10),
    );
  } else if (id === "bananas") {
    // Three separated crescent silhouettes, not one yellow blob.
    d.stamp(
      [
        ".....oo.........",
        "....oYo.........",
        "....oyoo........",
        "...oywyo........",
        "...oywyo..oo....",
        "...oywyo.oYo....",
        "...oywyooyyo....",
        "...oywyywyyo....",
        "....oywwywyo....",
        "....oywwwyyo....",
        ".....oywyyo.....",
        "......oyyo......",
        ".......oo.......",
      ],
      Math.max(0, cx - 8),
      Math.max(0, Math.floor((h - 13) / 2)),
    );
  } else if (id === "beacon") {
    rect(cx - 7, bottom - 6, 14, 5, "o");
    rect(cx - 6, bottom - 5, 12, 2, "h");
    rect(cx - 4, bottom - 3, 8, 2, "j");
    rect(cx - 3, bottom - 13, 6, 7, "o");
    rect(cx - 2, bottom - 13, 4, 7, "h");
    gem(cx, Math.max(8, bottom - 21), Math.min(7, cx - 2));
    rect(cx - 7, bottom - 15, 14, 2, "Y");
    rect(cx - 5, bottom - 16, 10, 1, "y");
  } else if (id === "goal-flag") {
    rect(4, 3, 2, h - 5, "o");
    rect(4, 3, 1, h - 7, "w");
    rect(2, bottom, 7, 1, "o");
    rect(3, 1, 4, 3, "y");
    const fw = w - 9;
    for (let yy = 0; yy < Math.min(12, h - 9); yy++) {
      const edge = yy < 6 ? 0 : Math.floor((yy - 6) / 2);
      rect(6, 4 + yy, fw - edge, 1, yy === 0 || yy === 11 ? "o" : "p");
      if (yy > 2 && yy < 8) rect(9, 4 + yy, 3, 1, "w");
    }
  } else if (id === "woodland-key") {
    d.stamp(
      [
        "....ooooo.....",
        "...oywwyyo....",
        "..oywoowyyo...",
        "..oyyo.oyyo...",
        "...oyyyyo.....",
        "....oyyo......",
        "....oyyo......",
        "....oyyo......",
        "....oyyo......",
        "....oyyyyo....",
        "....oyyoyo....",
        "....oooooo....",
      ],
      cx - 7,
      Math.max(1, h - 16),
    );
  } else if (
    id === "amber-lantern" ||
    id === "festival-lantern" ||
    id === "flora-lantern"
  ) {
    const ly = id === "flora-lantern" ? 10 : 3,
      lw = Math.min(12, w - 2);
    rect(cx - 2, ly, 4, 1, "Y");
    rect(cx - 3, ly + 1, 1, 3, "Y");
    rect(cx + 2, ly + 1, 1, 3, "Y");
    rect(cx - lw / 2, ly + 5, lw, 2, "o");
    rect(cx - lw / 2 + 1, ly + 7, lw - 2, 9, "Y");
    rect(cx - lw / 2 + 2, ly + 7, lw - 4, 8, "y");
    rect(cx - 1, ly + 8, 2, 6, "w");
    rect(cx - lw / 2 + 1, ly + 16, lw - 2, 2, "o");
    rect(cx - 1, ly + 18, 2, 2, "Y");
  } else if (id === "cottage") {
    const wallTop = Math.floor(h * 0.42),
      left = 6,
      right = w - 7;
    rect(left, wallTop, right - left, h - wallTop - 2, "o");
    rect(left + 1, wallTop + 2, right - left - 2, h - wallTop - 5, "s");
    for (let yy = 0; yy < wallTop; yy++) {
      const span = Math.min(w - 2, 8 + yy * 3);
      rect(
        cx - span / 2,
        2 + yy,
        span,
        1,
        yy === wallTop - 1 ? "o" : yy % 4 === 0 ? "T" : "t",
      );
    }
    rect(cx - 5, h - 17, 10, 15, "o");
    rect(cx - 4, h - 16, 8, 14, "k");
    rect(cx + 2, h - 10, 1, 1, "y");
    for (const x of [10, w - 16]) {
      rect(x, wallTop + 6, 6, 7, "o");
      rect(x + 1, wallTop + 7, 4, 5, "C");
      rect(x + 3, wallTop + 7, 1, 5, "w");
      rect(x, wallTop + 13, 6, 2, "t");
    }
    rect(w - 13, 3, 5, 7, "o");
    rect(w - 12, 3, 3, 6, "t");
    rect(4, h - 2, w - 8, 1, "g");
  } else if (id === "root-gate") {
    for (const x of [2, w - 5]) {
      rect(x, 3, 3, h - 5, "o");
      rect(x, 4, 2, h - 7, "K");
    }
    for (let x = 6; x < w - 5; x += 4) {
      rect(x, 5, 2, h - 9, "o");
      rect(x, 5, 1, h - 10, "k");
    }
    rect(4, 7, w - 8, 2, "K");
    rect(4, h - 8, w - 8, 2, "K");
    rect(cx - 2, h / 2 - 2, 4, 5, "Y");
    rect(cx - 1, h / 2, 2, 2, "o");
    line(2, 3, 7, 0, "g");
    line(w - 4, 3, w - 8, 1, "G");
  } else if (id === "shrine") {
    rect(3, h - 7, w - 6, 5, "o");
    rect(4, h - 6, w - 8, 2, "h");
    rect(7, h - 11, w - 14, 5, "j");
    rect(8, h - 11, w - 16, 2, "H");
    for (const x of [8, w - 12]) {
      rect(x, 12, 4, h - 23, "o");
      rect(x + 1, 12, 2, h - 24, "h");
    }
    for (let yy = 0; yy < 9; yy++) {
      const span = 8 + yy * 3;
      rect(cx - span / 2, 3 + yy, span, 1, yy === 8 ? "o" : yy < 3 ? "H" : "h");
    }
    rect(cx - 4, h - 20, 8, 8, "Y");
    rect(cx - 3, h - 20, 6, 7, "y");
    rect(cx - 1, h - 19, 2, 5, "w");
  } else if (id.endsWith("-pot")) {
    pot(id === "gold-pot" ? "Y" : "t");
    const y = Math.max(7, h - 15);
    line(cx, h - 12, cx, y - 3, "g");
    if (id === "seedling-pot") {
      d.stamp(["lG...", "GlG..", ".GgGl", "..gGG", "..g.."], cx - 3, y - 5);
    } else {
      for (const [dx, dy] of [
        [-3, 0],
        [3, 0],
        [0, -3],
        [0, 3],
      ])
        oval(cx + dx, y + dy, 3, 2, id === "gold-pot" ? "y" : "p");
      rect(cx - 1, y - 1, 3, 3, "w");
      line(cx, y + 4, cx + 4, y + 1, "G");
    }
  } else if (id === "hedge") {
    rect(1, 4, w - 2, h - 5, "g");
    rect(3, 2, w - 6, 3, "g");
    for (let x = 3; x < w - 3; x += 6) {
      rect(x, 3, 4, 3, "G");
      rect(x + 2, 7, 3, 2, "l");
    }
    rect(2, h - 3, w - 4, 1, "o");
  } else if (id === "brass-paddle") {
    rect(2, 5, w - 4, 7, "o");
    rect(3, 5, w - 6, 2, "s");
    rect(4, 7, w - 8, 3, "Y");
    rect(6, 8, w - 12, 1, "y");
    rect(4, 11, w - 8, 1, "k");
    for (const x of [4, w - 7]) rect(x, 7, 2, 3, "C");
  } else if (id === "clockwork-gem") {
    gem(cx, Math.floor(h / 2), Math.min(cx - 2, Math.floor(h / 2) - 1));
  } else if (id === "dog-biscuit") {
    const y = Math.floor(h / 2);
    oval(5, y - 2, 3, 3, "Y");
    oval(5, y + 2, 3, 3, "Y");
    oval(w - 6, y - 2, 3, 3, "Y");
    oval(w - 6, y + 2, 3, 3, "Y");
    rect(5, y - 3, w - 10, 7, "Y");
    rect(5, y - 2, w - 10, 3, "s");
    for (let x = 7; x < w - 6; x += 4) d.dot(x, y + 1, "K");
  } else if (id === "keepsake-ribbon") {
    d.stamp(
      [
        ".oooo...oooo.",
        "oppppo.oppppo",
        "opwwppopwwppo",
        ".oppppbppppo.",
        "..opppbpppo..",
        "...opppppo...",
        "...ooobooo...",
        "..oppoboppo..",
        "..oppo.oppo..",
        ".oppo...oppo.",
        ".ooo.....ooo.",
      ],
      cx - 6,
      Math.max(1, h - 16),
    );
  } else if (id === "keepsake-seeds") {
    rect(cx - 7, 4, 14, h - 7, "o");
    rect(cx - 6, 5, 12, h - 9, "s");
    rect(cx - 6, 5, 12, 3, "G");
    rect(cx - 4, 10, 8, 7, "w");
    d.stamp([".g.", "Ggl", ".g.", "YoY"], cx - 1, 11);
    rect(cx - 5, h - 6, 10, 1, "S");
  } else if (id === "keepsake-compass") {
    const r = Math.min(cx - 2, Math.floor(h / 2) - 2),
      cy = Math.floor(h / 2);
    oval(cx, cy, r, r, "o");
    oval(cx, cy, r - 1, r - 1, "Y");
    oval(cx, cy, r - 3, r - 3, "w");
    line(cx, cy - r + 4, cx, cy + r - 4, "j");
    line(cx - r + 4, cy, cx + r - 4, cy, "j");
    d.stamp([".t.", "ttt", ".o.", ".H."], cx - 1, cy - 3);
    d.dot(cx, cy, "o");
  } else if (id === "flower-spring") {
    for (let yy = h - 10; yy < h - 3; yy += 3) {
      line(cx - 5, yy, cx + 5, yy + 2, "H");
      line(cx + 5, yy + 2, cx - 5, yy + 3, "j");
    }
    rect(cx - 8, h - 3, 16, 2, "o");
    oval(cx, 8, 9, 4, "p");
    oval(cx, 8, 6, 2, "w");
    rect(cx - 2, 7, 5, 2, "y");
  } else if (id === "leaf-ferry") {
    const y = Math.floor(h / 2);
    for (let yy = -5; yy <= 5; yy++) {
      const span = w - 4 - Math.abs(yy) * 3;
      rect(cx - span / 2, y + yy, span, 1, yy < 0 ? "G" : "g");
    }
    line(3, y, w - 4, y, "l");
    for (let x = 10; x < w - 8; x += 8) {
      line(x, y, x + 4, y - 3, "l");
      line(x, y, x + 4, y + 3, "G");
    }
  } else if (id === "picnic-basket") {
    rect(5, 10, w - 10, h - 12, "o");
    rect(6, 11, w - 12, h - 14, "K");
    for (let yy = 13; yy < h - 3; yy += 4) rect(7, yy, w - 14, 1, "s");
    for (let x = 9; x < w - 8; x += 5) rect(x, 12, 1, h - 16, "Y");
    rect(4, 10, w - 8, 3, "s");
    line(9, 10, 9, 5, "Y");
    line(9, 5, w - 10, 5, "Y");
    line(w - 10, 5, w - 10, 10, "Y");
    rect(cx - 6, 9, 12, 5, "w");
    rect(cx - 3, 9, 2, 5, "p");
  } else if (id === "keepsake-album") {
    rect(3, 3, w - 6, h - 6, "o");
    rect(4, 4, w - 8, h - 8, "c");
    rect(6, 4, 2, h - 8, "C");
    rect(12, 8, w - 20, h - 15, "w");
    rect(w - 7, 6, 2, h - 11, "s");
    line(15, 11, 19, 8, "y");
    line(19, 8, 22, 12, "y");
  } else if (id === "festival-drum") {
    oval(cx, 8, cx - 3, 5, "o");
    rect(3, 8, w - 6, h - 13, "t");
    for (let x = 5; x < w - 4; x += 5) line(x, 10, x + 2, h - 6, "s");
    oval(cx, h - 6, cx - 3, 3, "Y");
    oval(cx, 8, cx - 4, 3, "w");
  } else if (id === "flora-crystal") {
    gem(cx + 5, h - 14, 8);
    gem(cx - 5, h - 11, 6);
    rect(5, h - 4, w - 10, 2, "j");
  } else if (id === "flora-gear") {
    const cy = Math.floor(h / 2) + 3,
      r = Math.min(cx - 3, 13);
    for (let a = 0; a < 8; a++) {
      const angle = (a * Math.PI) / 4;
      rect(
        cx + Math.round(Math.cos(angle) * r) - 2,
        cy + Math.round(Math.sin(angle) * r) - 2,
        5,
        5,
        "Y",
      );
    }
    oval(cx, cy, r - 2, r - 2, "Y");
    oval(cx, cy, r - 4, r - 4, "s");
    oval(cx, cy, r - 6, r - 6, "o");
    oval(cx, cy, 3, 3, "Y");
  } else if (id === "flora-palm") {
    for (let yy = 13; yy < h - 2; yy++) {
      const x = cx + Math.floor((yy - 13) / 9);
      rect(x, yy, 4, 1, yy % 5 === 0 ? "S" : "K");
    }
    for (const [dx, dy] of [
      [-12, 1],
      [-10, -6],
      [-4, -10],
      [7, -8],
      [13, -2],
      [11, 5],
    ]) {
      line(cx, 13, cx + dx, 13 + dy, "g");
      line(cx, 12, cx + dx, 12 + dy, "G");
      line(cx, 11, cx + Math.round(dx * 0.8), 11 + dy, "l");
    }
    oval(cx + 2, 15, 2, 2, "k");
    oval(cx - 1, 16, 2, 2, "K");
  } else if (id === "flora-olive") {
    rect(cx - 1, 14, 4, h - 16, "k");
    line(cx, 26, cx - 7, 19, "K");
    line(cx + 1, 24, cx + 9, 18, "K");
    for (const [dx, dy, rx] of [
      [-7, 14, 7],
      [6, 12, 9],
      [0, 7, 8],
    ]) {
      oval(cx + dx, dy, rx, 6, "g");
      oval(cx + dx - 1, dy - 2, rx - 2, 3, "G");
    }
    d.dot(cx - 8, 14, "o");
    d.dot(cx + 4, 9, "o");
    d.dot(cx + 10, 15, "o");
  } else if (id === "flora-succulent") {
    rect(cx - 7, h - 9, 14, 7, "t");
    rect(cx - 8, h - 10, 16, 3, "T");
    for (const [dx, dy, rx, ry] of [
      [-5, -15, 6, 4],
      [5, -15, 6, 4],
      [-3, -21, 4, 7],
      [3, -21, 4, 7],
      [0, -16, 4, 5],
    ]) {
      oval(cx + dx, h + dy, rx, ry, "g");
      oval(cx + dx - 1, h + dy - 1, rx - 2, ry - 2, "G");
    }
  } else if (id === "flora-fern") {
    const yy = h - 5;
    line(cx, yy, cx, yy - 21, "g");
    for (let n = 0; n < 5; n++) {
      const y = yy - 4 - n * 4,
        span = Math.min(cx - 2, 11 - n * 2);
      line(cx, y, cx - span, y - 3, "g");
      line(cx, y - 1, cx - span, y - 4, "G");
      line(cx, y, cx + span, y - 4, "G");
      line(cx, y - 1, cx + span, y - 5, "l");
    }
    rect(cx - 3, yy, 7, 2, "g");
  } else if (id === "flora-lotus") {
    oval(cx, h - 6, 13, 3, "g");
    for (const [dx, dy] of [
      [-6, -3],
      [6, -3],
      [-3, -7],
      [3, -7],
      [0, -10],
    ]) {
      oval(cx + dx, h - 8 + dy, 4, 6, "p");
      line(cx + dx, h - 11 + dy, cx + dx, h - 7 + dy, "w");
    }
    rect(cx - 2, h - 12, 5, 3, "y");
  }
  return d;
}
