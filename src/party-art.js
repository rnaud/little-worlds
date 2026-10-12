import { paintWorldDetails } from "./world-details.js";
// Native 320×180 scenery: quiet play areas framed by small, deliberate clusters.
export function partyBackground(id) {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 180;
  const ctx = c.getContext("2d");
  const r = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  if (id === "bubbles") {
    r(0, 0, 320, 180, "#20374e");
    r(0, 20, 320, 150, "#29455d");
    for (let x = 10; x < 320; x += 60) {
      r(x, 24, 4, 128, "#35566b");
      r(x + 4, 24, 30, 3, "#35566b");
      r(x + 34, 27, 4, 125, "#35566b");
      r(x + 8, 31, 22, 39, "#21394f");
      r(x + 11, 29, 16, 3, "#21394f");
      r(x + 17, 32, 3, 38, "#3e6274");
      r(x + 8, 50, 22, 3, "#3e6274");
    }
    r(0, 166, 320, 14, "#1c3047");
    r(0, 168, 320, 2, "#487389");
    for (let x = 0; x < 320; x += 32) {
      r(x, 174, 18, 1, "#35566b");
      r(x + 9, 179, 13, 1, "#35566b");
    }
    for (const [x, y] of [
      [32, 12],
      [151, 8],
      [276, 14],
    ]) {
      r(x, y, 4, 4, "#678f9b");
      r(x + 1, y - 2, 2, 2, "#aac8bf");
    }
  } else {
    r(0, 0, 320, 180, "#9aa48b");
    r(0, 0, 320, 22, "#829e91");
    r(0, 22, 320, 145, "#b2b396");
    for (const x of [7, 285]) {
      r(x, 30, 27, 130, "#718b78");
      r(x + 3, 32, 20, 5, "#829d80");
      for (let y = 50; y < 155; y += 27) {
        r(x + 3, y, 6, 14, "#62836f");
        r(x + 15, y + 7, 8, 11, "#819a78");
      }
    }
    r(0, 167, 320, 13, "#889982");
    r(0, 167, 320, 2, "#cad0aa");
    for (let x = 48; x < 280; x += 36) {
      r(x, 8, 8, 4, "#c6cbab");
      r(x + 2, 5, 4, 4, "#c6cbab");
    }
    for (const [x, y] of [
      [19, 45],
      [303, 92],
      [17, 138],
    ]) {
      r(x, y, 3, 3, "#d2ba74");
      r(x - 2, y + 2, 3, 3, "#c0a65f");
    }
  }
  paintWorldDetails(ctx, id);
  return c;
}
