import { PixelDrawing } from "./native-actors.js";

// Each size is its own silhouette. A tiny projectile must stay readable rather
// than inherit broken eyes or uneven points from a reduced collectible sprite.
const STARS = [
  [".w.", "wcw", ".w."],
  ["..w..", "..c..", "wcccw", ".ccc.", ".c.c."],
  ["...o...", "..owo..", "ooocooo", ".occco.", "..ccc..", ".ococo.", ".oo.oo."],
  [
    "......o......",
    ".....owo.....",
    ".....oco.....",
    "....owcco....",
    "ooooowccooooo",
    ".owcccccccco.",
    "..occccccco..",
    "...occccco...",
    "...occccco...",
    "..occcoccco..",
    "..occo.occo..",
    ".occo...occo.",
    ".ooo.....ooo.",
  ],
];

export function drawNativeStar(radius, color = "#ffe08a") {
  const rows = STARS[radius < 5 ? 0 : radius < 8 ? 1 : radius < 12 ? 2 : 3];
  const size = rows.length;
  const d = new PixelDrawing(size, size, {
    o: "#303047",
    c: color,
    w: "#fff5d8",
  });
  d.stamp(rows, 0, 0);
  return d;
}
