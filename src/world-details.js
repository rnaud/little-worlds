// Scenery lives behind gameplay. All marks are authored on the 320×180 grid.
function ink(ctx) {
  const r = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const line = (x, y, tx, ty, c) => {
    const steps = Math.max(Math.abs(tx - x), Math.abs(ty - y));
    for (let n = 0; n <= steps; n++)
      r(
        x + ((tx - x) * n) / (steps || 1),
        y + ((ty - y) * n) / (steps || 1),
        1,
        1,
        c,
      );
  };
  const roof = (x, y, w, h, c) => {
    for (let n = 0; n < h; n++)
      r(x - (n * w) / (2 * h), y + n, (n * w) / h + 1, 1, c);
  };
  const house = (x, y, w, h, wall, top, light) => {
    r(x, y, w, h, wall);
    roof(x + w / 2, y - 7, w + 6, 8, top);
    r(x + w - 5, y - 6, 2, 5, top);
    for (let dx = 3; dx < w - 2; dx += 7) {
      r(x + dx, y + 3, 3, 4, top);
      r(x + dx, y + 3, 2, 3, light);
    }
    r(x + Math.floor(w / 2), y + h - 5, 3, 5, top);
  };
  const pot = (x, y, color, leaf) => {
    r(x, y, 5, 4, color);
    r(x - 1, y, 7, 1, color);
    r(x + 2, y - 6, 1, 6, leaf);
    r(x - 1, y - 4, 3, 2, leaf);
    r(x + 3, y - 6, 3, 2, leaf);
  };
  return { r, line, roof, house, pot };
}
export function paintWorldDetails(ctx, id, layer = 0) {
  const { r, line, roof, house, pot } = ink(ctx);
  if (id === "summit") {
    if (layer === 0) {
      // Pale sun and broad aurora ribbons leave the jump corridor uncluttered.
      for (let y = 0; y < 6; y++) r(239 - y, 29 + y, 8 + y * 2, 1, "#d5e0dc");
      for (let x = 0; x < 320; x++) {
        const y = 9 + Math.round(Math.sin(x / 61) * 5);
        r(x, y, 1, 3, "#b6cbd5");
      }
    }
    if (layer === 1) {
      house(42, 119, 23, 14, "#819bb0", "#71899e", "#d6cba5");
      house(70, 128, 17, 11, "#819bb0", "#71899e", "#d6cba5");
      // Observatory dome, telescope slit and a stepped ridge approach.
      r(213, 105, 31, 20, "#819bb0");
      roof(228, 88, 34, 18, "#b3cad4");
      r(228, 92, 3, 15, "#71899e");
      r(211, 105, 35, 3, "#d6cba5");
      r(224, 113, 5, 12, "#71899e");
      line(246, 122, 264, 136, "#b3cad4");
      for (let n = 0; n < 5; n++) r(245 + n * 4, 123 + n * 3, 5, 1, "#d6cba5");
      line(0, 104, 138, 88, "#819bb0");
      r(18, 98, 2, 39, "#819bb0");
      r(127, 87, 2, 44, "#819bb0");
      r(54, 101, 10, 8, "#71899e");
      r(55, 102, 8, 3, "#b3cad4");
      line(59, 97, 59, 101, "#819bb0");
    }
    if (layer === 2) {
      house(169, 158, 20, 16, "#647f99", "#718ea6", "#a4becd");
      r(196, 155, 2, 25, "#647f99");
      r(198, 156, 8, 4, "#8da8bb");
      for (let n = 0; n < 4; n++) {
        r(83 + n * 5, 172, 1, 8, "#647f99");
        r(83 + n * 5, 174, 6, 1, "#7e9aaf");
      }
    }
  } else if (id === "meadow") {
    if (layer === 0) {
      r(0, 91, 320, 28, "#bbd6c9");
      for (let n = 0; n < 9; n++) r(n * 39, 99 + (n % 3) * 5, 15, 1, "#d4e4d7");
      // Sailboats across the bay, behind the village.
      for (const [x, y] of [
        [78, 103],
        [253, 96],
      ]) {
        r(x, y, 14, 2, "#81a99b");
        line(x + 7, y, x + 7, y - 15, "#81a99b");
        for (let n = 0; n < 10; n++)
          r(x + 6 - n, y - 12 + n, n + 1, 1, "#e8ebd8");
      }
    }
    if (layer === 1) {
      house(24, 109, 24, 23, "#b8b6a0", "#b99888", "#e8ebd8");
      house(53, 115, 19, 17, "#b8b6a0", "#b99888", "#e8ebd8");
      house(88, 103, 18, 30, "#b8b6a0", "#b99888", "#e8ebd8");
      r(92, 99, 10, 3, "#859f94");
      r(94, 91, 6, 8, "#b8b6a0");
      r(95, 93, 4, 4, "#859f94");
      house(220, 115, 30, 21, "#b8b6a0", "#b99888", "#e8ebd8");
      // Wharf posts and fishing nets.
      r(118, 132, 55, 3, "#859f94");
      for (let x = 121; x < 173; x += 13) r(x, 132, 2, 13, "#859f94");
      line(126, 136, 151, 141, "#a7c7bd");
    }
    if (layer === 2) {
      // An open fruit stall, laundry and a picnic spot in the nearer village.
      r(194, 154, 2, 23, "#7b9e8c");
      r(218, 154, 2, 23, "#7b9e8c");
      r(191, 150, 32, 5, "#bbbaa0");
      for (let x = 192; x < 223; x += 8) r(x, 150, 4, 5, "#98afa0");
      r(194, 170, 26, 4, "#7b9e8c");
      for (let x = 197; x < 218; x += 6) r(x, 167, 4, 3, "#bbbaa0");
      line(52, 154, 91, 157, "#7b9e8c");
      for (let x = 56; x < 89; x += 10) r(x, 156, 6, 7, "#bbd6c9");
      r(108, 175, 18, 2, "#7b9e8c");
      r(111, 177, 2, 3, "#7b9e8c");
      r(121, 177, 2, 3, "#7b9e8c");
    }
  } else if (id === "forest") {
    // Small traces of a woodland settlement stay at the canopy edges.
    house(36, 11, 24, 17, "#46615a", "#29464a", "#b9a275");
    line(47, 28, 47, 51, "#46615a");
    line(53, 28, 53, 51, "#46615a");
    for (let y = 32; y < 51; y += 5) r(47, y, 7, 1, "#607769");
    line(60, 22, 100, 15, "#46615a");
    for (let x = 66; x < 99; x += 8) r(x, 19, 1, 5, "#46615a");
    r(258, 12, 28, 3, "#46615a");
    for (const x of [260, 279]) {
      r(x, 15, 3, 14, "#46615a");
      pot(x - 1, 27, "#607769", "#46615a");
    }
    // Moss-covered old stonework and stepping stones, not collision walls.
    for (let n = 0; n < 6; n++) {
      r(78 + n * 24, 158 + (n % 2) * 3, 12, 3, "#34564d");
      r(80 + n * 24, 158 + (n % 2) * 3, 8, 1, "#46615a");
    }
    for (const [x, y] of [
      [13, 67],
      [301, 116],
      [67, 169],
    ]) {
      r(x, y, 7, 3, "#607769");
      r(x + 2, y - 2, 3, 2, "#8b9571");
      r(x + 3, y + 3, 1, 3, "#46615a");
    }
    r(124, 8, 21, 2, "#46615a");
    r(127, 10, 2, 7, "#46615a");
    r(140, 10, 2, 7, "#46615a");
    r(133, 5, 4, 3, "#8b9571"); // A forgotten picnic cup.
  } else if (id === "garden") {
    // Working benches occupy the margins, leaving every puzzle square clear.
    for (const x of [29, 257]) {
      r(x, 37, 32, 3, "#887e67");
      r(x + 2, 40, 2, 10, "#887e67");
      r(x + 27, 40, 2, 10, "#887e67");
      for (let n = 0; n < 3; n++) pot(x + 3 + n * 10, 33, "#b58f79", "#7d8877");
    }
    for (const x of [71, 208]) {
      r(x, 8, 13, 2, "#7d8877");
      r(x + 5, 0, 1, 8, "#7d8877");
      pot(x + 4, 10, "#a88d71", "#7d8877");
    }
    r(32, 147, 24, 3, "#887e67");
    r(35, 150, 3, 10, "#887e67");
    r(50, 150, 3, 10, "#887e67");
    r(35, 141, 6, 5, "#7d8877");
    line(41, 142, 46, 138, "#7d8877");
    r(34, 142, 1, 3, "#c4b18b");
    r(259, 149, 19, 9, "#a88d71");
    r(258, 148, 21, 2, "#887e67");
    for (let n = 0; n < 3; n++) r(261 + n * 6, 151, 3, 4, "#c4b18b");
    line(285, 139, 279, 161, "#887e67");
    r(275, 159, 6, 3, "#7d8877");
    r(137, 6, 44, 16, "#8e917b");
    r(139, 8, 40, 12, "#a9bda7");
    // Hand-drawn leaf diagram on Nur's greenhouse notice board.
    line(159, 10, 159, 18, "#7d8877");
    r(155, 11, 4, 2, "#7d8877");
    r(160, 14, 4, 2, "#7d8877");
  } else if (id === "bricks") {
    for (const x of [24, 274]) {
      r(x, 67, 22, 3, "#485061");
      r(x, 99, 22, 3, "#485061");
      r(x, 131, 22, 3, "#485061");
      for (let n = 0; n < 5; n++) {
        r(
          x + 2 + n * 4,
          56 + (n % 2) * 3,
          3,
          11 - (n % 2) * 3,
          n % 2 ? "#555565" : "#6a6068",
        );
        r(x + 2 + n * 4, 88 + (n % 3), 3, 11 - (n % 3), "#485061");
      }
      r(x + 4, 118, 13, 10, "#485061");
      r(x + 6, 120, 9, 6, "#303f52");
    }
    // Clockmaker's brass orrery, gears and pendulum in the recesses.
    for (const [cx, cy] of [
      [66, 42],
      [252, 123],
    ]) {
      for (let a = 0; a < 24; a++) {
        const t = (a * Math.PI) / 12;
        r(cx + Math.cos(t) * 9, cy + Math.sin(t) * 9, 2, 2, "#485061");
      }
      r(cx - 2, cy - 2, 4, 4, "#6a6068");
    }
    r(78, 173, 25, 3, "#485061");
    r(81, 170, 3, 3, "#6a6068");
    r(91, 170, 7, 3, "#6a6068");
  } else if (id === "space") {
    // A distant inhabited orbital outpost, kept away from enemy flight lanes.
    r(82, 23, 25, 7, "#555b79");
    r(89, 20, 11, 13, "#63708b");
    r(60, 22, 18, 9, "#353159");
    r(111, 22, 18, 9, "#353159");
    for (let n = 0; n < 4; n++) {
      r(62 + n * 4, 23, 1, 7, "#555b79");
      r(113 + n * 4, 23, 1, 7, "#555b79");
    }
    r(78, 26, 4, 1, "#9b9bab");
    r(107, 26, 4, 1, "#9b9bab");
    r(93, 16, 2, 4, "#9b9bab");
    r(91, 24, 3, 2, "#be9290");
    r(99, 24, 3, 2, "#be9290");
    // A tiny crescent moon and a dark foreground planetoid give depth.
    for (let y = 0; y < 11; y++)
      r(33 - Math.sin((y / 10) * Math.PI) * 5, 147 + y, 3, 1, "#63708b");
    for (let x = 240; x < 320; x++) {
      const y = 174 + Math.round((x - 282) ** 2 / 220);
      r(x, y, 1, 180 - y, "#302e54");
    }
    r(283, 168, 10, 6, "#353159");
    r(288, 165, 1, 3, "#555b79");
  } else if (id === "bubbles") {
    // Copper pipes, drying cloths and vats: a soapworks rather than an empty hall.
    for (const x of [54, 234]) {
      r(x, 12, 5, 62, "#496272");
      r(x + 1, 13, 1, 59, "#67848b");
      r(x, 73, 25, 5, "#496272");
      r(x + 22, 73, 4, 18, "#496272");
      for (const y of [26, 54]) r(x - 2, y, 9, 3, "#67848b");
      r(x + 20, 88, 8, 3, "#67848b");
    }
    line(90, 14, 207, 18, "#496272");
    for (const x of [105, 134, 164, 193]) {
      r(x, 17, 11, 13, "#587582");
      r(x + 3, 17, 5, 5, "#29455d");
      r(x + 2, 29, 8, 1, "#67848b");
    }
    for (const x of [16, 280]) {
      r(x, 131, 24, 23, "#496272");
      r(x - 2, 130, 28, 4, "#67848b");
      r(x + 3, 134, 2, 17, "#587582");
      r(x + 18, 134, 2, 17, "#587582");
      r(x + 3, 127, 18, 3, "#8da7a3");
      r(x, 135, 24, 2, "#8a8079");
      r(x, 150, 24, 2, "#8a8079");
    }
    r(114, 174, 34, 3, "#496272");
    r(118, 171, 8, 3, "#67848b");
    r(132, 171, 10, 3, "#587582");
  } else if (id === "splash") {
    // Balconies, laundry and cafe furniture frame the playable courtyard.
    for (const x of [58, 145, 232]) {
      r(x, 0, 24, 15, "#718b78");
      r(x + 3, 1, 18, 11, "#62836f");
      r(x + 6, 2, 2, 9, "#a7b6a0");
      r(x + 16, 2, 2, 9, "#a7b6a0");
      r(x - 3, 14, 30, 3, "#8c947d");
      for (let n = 0; n < 5; n++) r(x + n * 5, 10, 1, 5, "#a7b6a0");
      pot(x + 17, 16, "#ab9f82", "#62836f");
    }
    line(96, 6, 134, 10, "#8c947d");
    for (let n = 0; n < 3; n++) r(101 + n * 10, 8 + n, 6, 7, "#c6cbab");
    for (const [x, y] of [
      [14, 73],
      [291, 125],
    ]) {
      r(x, y, 14, 3, "#ab9f82");
      r(x + 6, y + 3, 2, 9, "#8c947d");
      r(x - 2, y + 8, 4, 2, "#8c947d");
      r(x + 12, y + 8, 4, 2, "#8c947d");
      r(x + 5, y - 3, 3, 3, "#c6cbab");
    }
    r(78, 173, 34, 4, "#8c947d");
    r(81, 170, 3, 3, "#ab9f82");
    r(102, 170, 3, 3, "#ab9f82");
    for (const x of [193, 213, 238]) pot(x, 174, "#ab9f82", "#62836f");
  }
}
export function paintRivieraVillage(ctx, distance = 0) {
  const { r, line, roof, house } = ink(ctx);
  const offset = Math.round(distance * 0.025) % 380;
  for (let tile = -1; tile <= 1; tile++) {
    const base = tile * 380 - offset;
    for (const [x, y, w, h] of [
      [22, 42, 23, 15],
      [51, 45, 17, 12],
      [76, 38, 25, 19],
      [245, 46, 23, 11],
      [276, 42, 20, 15],
    ])
      house(base + x, y, w, h, "#a9b5a5", "#829a92", "#d5d9bc");
    r(base + 126, 32, 10, 26, "#b8bba6");
    roof(base + 131, 25, 14, 8, "#829a92");
    r(base + 128, 34, 6, 5, "#d5d9bc");
    r(base + 123, 40, 16, 2, "#829a92");
    line(base + 183, 45, base + 183, 55, "#829a92");
    roof(base + 178, 44, 10, 10, "#d5d9bc");
    r(base + 175, 55, 18, 2, "#829a92");
  }
}
// Ambient details use the game clock, so pausing freezes them with the world.
export function drawWorldLife(p, id, time = 0, camera = 0, generated = false) {
  const dot = (x, y, w, h, c) =>
    p.rect(
      Math.round(x) * 3 + w * 1.5,
      Math.round(y) * 3 + h * 1.5,
      w * 3,
      h * 3,
      c,
    );
  if (id === "summit" || id === "meadow") {
    const color = id === "summit" ? "#819bb0" : "#859f94";
    for (let n = 0; n < 3; n++) {
      const x =
        ((((time * 3 + n * 79 - camera * 0.02) % 370) + 370) % 370) - 25;
      const y = 47 + n * 8 + Math.round(Math.sin(time + n) * 2);
      const flap = Math.floor(time * 3 + n) % 2;
      dot(x, y, 1, 1, color);
      dot(x - 2, y - flap, 2, 1, color);
      dot(x + 1, y - flap, 2, 1, color);
    }
    if (id === "summit" && !generated) {
      // Cable car traverses the distant line independently of the player.
      const x = ((((time * 2 - (camera * 0.14) / 3) % 110) + 110) % 110) + 16;
      const y = 104 - (x * 16) / 138;
      dot(x, y, 1, 4, "#819bb0");
      dot(x - 4, y + 4, 10, 7, "#71899e");
      dot(x - 3, y + 5, 8, 3, "#b3cad4");
    }
  } else if (id === "forest" || id === "garden" || id === "splash") {
    for (let n = 0; n < 4; n++) {
      const x =
        [18, 299, 84, 233][n] + Math.round(Math.sin(time * 0.7 + n) * 3);
      const y = [68, 128, 17, 170][n] + Math.round(Math.cos(time + n) * 2);
      if (Math.sin(time * 1.3 + n) > 0)
        dot(x, y, 1, 1, id === "forest" ? "#8b9571" : "#c6cbab");
    }
  } else if (id === "bubbles") {
    for (let n = 0; n < 4; n++) {
      const x = (n < 2 ? 27 : 291) + Math.round(Math.sin(time + n) * 3),
        y = 127 - ((time * 5 + n * 13) % 43);
      dot(x, y, 3, 1, "#67848b");
      dot(x - 1, y + 1, 1, 2, "#496272");
      dot(x + 3, y + 1, 1, 2, "#67848b");
      dot(x, y + 3, 3, 1, "#496272");
    }
  } else if (id === "bricks" && !generated) {
    const x = 53 + Math.round(Math.sin(time) * 5);
    p.line(53 * 3, 83 * 3, x * 3, 137 * 3, 3, "#485061");
    dot(x - 3, 137, 7, 4, "#6a6068");
  } else if (id === "space" && !generated) {
    const x = ((((time * 2) % 360) + 360) % 360) - 20;
    dot(x, 14, 5, 2, "#63708b");
    dot(x + 1, 12, 3, 2, "#555b79");
    dot(x - 3, 15, 2, 1, "#9b9bab");
    if (Math.floor(time * 2) % 3 === 0) dot(94, 16, 1, 1, "#be9290");
  }
}
