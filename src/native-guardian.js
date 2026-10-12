import { PixelDrawing } from "./native-actors.js";
const palette = {
  o: "#24263d",
  j: "#3b4164",
  h: "#638bb0",
  H: "#9acdda",
  w: "#fff1da",
  p: "#9f8dc5",
  b: "#675a9a",
  t: "#e59bb8",
  T: "#9a618d",
};
// Two authored silhouettes, each drawn directly onto its own integer grid.
export function drawMoonKeeper(frame = 0, small = false) {
  const d = new PixelDrawing(small ? 32 : 48, small ? 28 : 40, palette),
    cx = small ? 16 : 24,
    cy = small ? 13 : 19,
    bob = [0, -1, 0, 1][frame];
  const widths = small
    ? [4, 7, 9, 10, 11, 12, 12, 12, 12, 12, 11, 10, 9, 7, 4]
    : [
        5, 8, 11, 13, 15, 16, 17, 18, 18, 19, 19, 19, 19, 19, 19, 18, 18, 17,
        16, 15, 13, 11, 8, 5,
      ];
  const top = small ? 5 : 7;
  for (let row = 0; row < widths.length; row++) {
    const half = widths[row],
      y = top + row + bob;
    d.rect(cx - half, y, half * 2 + 1, 1, "o");
    d.rect(cx - half + 1, y, half * 2 - 1, 1, "h");
    if (row < widths.length - 4)
      d.rect(
        cx - half + 2,
        y,
        Math.max(1, half + Math.floor(half / 2) - 2),
        1,
        "H",
      );
    if (row > widths.length - 6) d.rect(cx - half + 2, y, half * 2 - 3, 1, "j");
  }
  const facet = (x, y, rows) => d.stamp(rows, x, y + bob);
  facet(
    cx - (small ? 8 : 13),
    top + 3,
    small
      ? [".wwH", "wwHH", ".HH."]
      : ["..wwwwHH", ".wwwwHHH", "wwwwHHHH", ".HHHHHH."],
  );
  facet(
    cx + (small ? 4 : 8),
    cy + 3,
    small
      ? [".hhj", "hhjj", ".jj."]
      : ["..hhhjj", ".hhhjjj", "hhhjjjj", ".jjjjj."],
  );
  // A dark mask keeps the eyes readable even against the light crystal shell.
  const faceY = cy - 2 + bob,
    eye = small ? 3 : 5;
  d.rect(cx - eye - 2, faceY - 1, eye * 2 + 5, small ? 5 : 7, "j");
  d.rect(cx - eye - 1, faceY, eye * 2 + 3, small ? 3 : 5, "o");
  for (const side of [-1, 1]) {
    const x = cx + side * eye;
    d.rect(
      x - 1,
      faceY + 1,
      small ? 2 : 3,
      frame === 2 ? 1 : small ? 2 : 3,
      frame === 3 ? "w" : "t",
    );
    if (frame !== 2) d.dot(x, faceY + 1, "w");
  }
  d.stamp(
    small ? [".hHh.", "..j.."] : [".hhHHhh.", "..hHHh..", "...jj..."],
    cx - (small ? 2 : 4),
    faceY + (small ? 4 : 6),
  );
  // Floating crown and side crystals have separate up/down poses.
  const gem = (x, y, r) => {
    for (let yy = -r; yy <= r; yy++) {
      const half = r - Math.abs(yy);
      d.rect(x - half, y + yy, half * 2 + 1, 1, "o");
      if (half) {
        d.rect(x - half + 1, y + yy, half, 1, "p");
        d.rect(x + 1, y + yy, Math.max(0, half - 1), 1, "b");
      }
    }
    d.dot(x, y - 1, "w");
  };
  gem(cx, small ? 2 : 3, small ? 2 : 3);
  gem(small ? 2 : 3, cy + (frame % 2 ? 1 : -1), small ? 2 : 3);
  gem(d.width - (small ? 3 : 4), cy + (frame % 2 ? -1 : 1), small ? 2 : 3);
  gem(cx, small ? 25 : 36, small ? 2 : 3);
  return d;
}
