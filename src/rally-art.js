// One native scanline per row. No filters or fractional raster edges.
export const rallyRoad = (distance, y) =>
  480 + Math.sin(distance / 360 + y / 220) * 85;
export function paintRallyRoad(ctx, distance = 0, finishDistance = 1800) {
  const rect = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  rect(0, 0, 320, 180, "#b9d9d8");
  rect(0, 32, 320, 26, "#d5e7d9");
  for (let y = 0; y < 17; y++)
    for (let x = 0; x < 17; x++)
      if ((x - 8) ** 2 + (y - 8) ** 2 <= 64)
        rect(252 + x, 17 + y, 1, 1, "#fff1bd");
  // A quiet coast stays fixed on the horizon; only the ground rushes by.
  for (let x = 0; x < 320; x++) {
    const hill =
      10 +
      Math.round(
        5 * Math.sin((x + distance * 0.012) / 37) + 3 * Math.sin(x / 13),
      );
    rect(x, 58 - hill, 1, hill, "#89aaa3");
  }
  rect(0, 55, 320, 3, "#83b8c2");
  for (let py = 58; py < 180; py++) {
    const depth = 90 / Math.max(0.5, py - 58),
      y = 424 - 140 * (depth - 1),
      scale = 1.5 / depth;
    const center =
      (480 + (rallyRoad(distance, y) - rallyRoad(distance, 424)) * scale) / 3;
    const stripe = Math.floor((y + distance * 2.85) / 76) % 2 === 0;
    rect(0, py, 320, 1, stripe ? "#80a478" : "#88aa7d");
    rect(center - (205 * scale) / 3, py, (410 * scale) / 3, 1, "#d9c398");
    rect(
      center - (188 * scale) / 3,
      py,
      (376 * scale) / 3,
      1,
      stripe ? "#fcf0cb" : "#c77263",
    );
    rect(
      center - (173 * scale) / 3,
      py,
      (346 * scale) / 3,
      1,
      stripe ? "#737c86" : "#78818b",
    );
    const finishY = 424 - (finishDistance - distance) / 0.35;
    if (Math.abs(y - finishY) < 24) {
      for (let lane = -172; lane < 172; lane += 24) {
        const dark =
          (Math.floor((lane + 172) / 24) +
            Math.floor((y - finishY + 24) / 12)) %
            2 ===
          0;
        rect(
          center + (lane * scale) / 3,
          py,
          Math.ceil((24 * scale) / 3),
          1,
          dark ? "#303948" : "#fff0cd",
        );
      }
    }
    if (stripe)
      for (const lane of [-58, 58])
        rect(
          center + ((lane - 2) * scale) / 3,
          py,
          Math.max(1, (4 * scale) / 3),
          1,
          "#f3e4b8",
        );
  }
}
