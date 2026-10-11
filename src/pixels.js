// Original pixel artwork. Integer rectangles only; shared by Three.js and the shelf.
export const FAMILY = [
  {
    id: "gaia",
    name: "Gaia",
    detail: "AGE 5 · LITTLE EXPLORER",
    bio: "Sandy-blonde hair, red headband, ready for one more jump.",
  },
  {
    id: "bean",
    name: "Bean",
    detail: "ITALIAN GREYHOUND",
    bio: "Fawn coat, white chest and paws, enormous adventure energy.",
  },
  {
    id: "nur",
    name: "Nur",
    detail: "MAMMA · ITALIAN",
    bio: "Dark bob and blue-striped blouse. Keeper of the lanterns and garden.",
  },
  {
    id: "arnaud",
    name: "Arnaud",
    detail: "PAPA · FRENCH · 39",
    bio: "Wavy hair and beard. The family’s co-pilot and star catcher.",
  },
];
const ink = "#201b35",
  white = "#fff4d4";
const cache = new Map();
function surface(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = false;
  return [c, x];
}
function pen(ctx) {
  return (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
}
export function sprite(id, frame = 0) {
  const key = id + ":" + frame;
  if (cache.has(key)) return cache.get(key);
  let [c, ctx] = surface(32, 40),
    r = pen(ctx);
  if (id.startsWith("driver-")) {
    [c, ctx] = surface(16, 16);
    ctx.imageSmoothingEnabled = false;
    const who = id.slice(7),
      sheet = sprite(who);
    if (who === "bean") ctx.drawImage(sheet, 17, 7, 15, 14, 0, 0, 16, 16);
    else ctx.drawImage(sheet, 7, who === "gaia" ? 9 : 6, 19, 17, 0, 0, 16, 16);
  } else if (["gaia", "nur", "arnaud"].includes(id)) {
    const girl = id === "gaia",
      mom = id === "nur",
      hair = girl ? "#d4a044" : mom ? "#211c32" : "#493941",
      hs = girl ? "#a67138" : mom ? "#3d3352" : "#20192d",
      shirt = girl ? "#69afd0" : mom ? "#a5d8e6" : "#405469",
      ss = girl ? "#397a9b" : mom ? "#617786" : "#293749";
    const y = girl ? 4 : 1;
    r(7, 36, 19, 2, "#252340");
    r(9, y + 2, 14, 3, ink);
    r(6, y + 5, 20, mom ? 21 : 12, ink);
    r(8, y + 3, 15, 8, hair);
    r(7, y + 7, 18, 9, hair);
    r(8, y + 12, 17, mom ? 12 : 5, hs);
    r(10, y + 8, 13, 11, "#e5a46b");
    r(10, y + 8, 11, 8, "#ffcf93");
    r(9, y + 7, 15, 4, hair);
    r(11, y + 6, 5, 7, hair);
    r(18, y + 13, 2, 2, ink);
    r(12, y + 13, 2, 2, ink);
    r(20, y + 16, 3, 2, "#d87c64");
    r(15, y + 18, 4, 1, "#974e50");
    if (girl) {
      r(7, y + 11, 3, 9, hs);
      r(23, y + 11, 3, 9, hair);
      r(9, y + 4, 13, 2, "#a94d60");
    }
    r(10, y + 20, 13, 13, ink);
    r(10, y + 21, 13, 9, ss);
    r(12, y + 21, 9, 7, shirt);
    r(12, y + 22, 3, 2, "#ffffff");
    r(7, y + 22, 4, 8, "#e5a46b");
    r(7, y + 22, 3, 5, "#ffcf93");
    r(23, y + 22, 4, 8, "#e5a46b");
    r(23, y + 22, 3, 5, "#ffcf93");
    const walk = frame % 2;
    r(11, y + 30, 5, 6, "#354466");
    r(18, y + 30, 5, 6, "#354466");
    r(9 + walk * 2, y + 34, 7, 3, ink);
    r(18 - walk * 2, y + 34, 7, 3, ink);
    r(10 + walk * 2, y + 34, 5, 1, "#a5c1d7");
    r(19 - walk * 2, y + 34, 5, 1, "#a5c1d7");
    if (id === "arnaud") {
      r(11, y + 16, 12, 4, hs);
      r(13, y + 16, 7, 1, hair);
      r(15, y + 18, 4, 1, "#d8a080");
      r(17, y + 24, 1, 1, white);
      r(17, y + 28, 1, 1, white);
    } else {
      r(13, y + 22, 2, 7, white);
      r(19, y + 22, 2, 7, white);
    }
  } else if (id === "bean") {
    r(3, 36, 27, 2, "#252340");
    r(4, 19, 16, 8, ink);
    r(5, 19, 14, 6, "#b77d53");
    r(6, 19, 12, 3, "#e2b382");
    r(17, 15, 6, 14, "#a96949");
    r(18, 12, 5, 14, "#d3a174");
    r(19, 9, 8, 7, ink);
    r(20, 10, 7, 5, "#dfb58b");
    r(24, 12, 7, 3, "#f4eee0");
    r(29, 12, 2, 2, ink);
    r(22, 10, 2, 2, ink);
    r(19, 8, 3, 4, "#855039");
    r(17, 9, 3, 4, "#b77d53");
    r(19, 19, 4, 8, "#f4eee0");
    r(17, 17, 7, 2, "#1e2332");
    r(22, 17, 1, 2, "#d4a044");
    r(5, 24, 3, 6, "#a96949");
    r(7, 29, 2, 7, "#d3a174");
    r(10, 24, 2, 12, "#b77d53");
    r(18, 27, 2, 9, "#dfb58b");
    r(22, 24, 2, 12, "#b77d53");
    r(6, 35, 5, 2, ink);
    r(17, 35, 4, 2, ink);
    r(22, 35, 4, 2, ink);
    r(18, 31, 2, 5, "#f4eee0");
    r(22, 31, 2, 5, "#f4eee0");
    r(2, 17, 3, 8, "#b77d53");
    r(1, 14, 2, 5, "#dfb58b");
    if (frame % 2) {
      r(10, 31, 2, 5, "#00000000");
      r(11, 30, 2, 5, "#b77d53");
    }
  } else if (id === "tree") {
    [c, ctx] = surface(40, 56);
    r = pen(ctx);
    r(16, 37, 9, 18, ink);
    r(17, 37, 6, 17, "#89563e");
    r(18, 38, 2, 14, "#bf8050");
    const rows = [
      [14, 0, 12],
      [8, 3, 23],
      [4, 7, 31],
      [1, 14, 37],
      [0, 24, 39],
      [4, 34, 32],
      [10, 40, 20],
    ];
    for (const [x, y, w] of rows) r(x, y, w, 10, ink);
    for (const [x, y, w] of rows) r(x + 2, y + 1, w - 4, 7, "#24654a");
    r(9, 7, 22, 10, "#409d50");
    r(5, 15, 28, 15, "#398b46");
    r(12, 3, 14, 8, "#83c455");
    r(7, 11, 12, 4, "#83c455");
    r(5, 19, 10, 4, "#64b34a");
    r(19, 13, 11, 6, "#5caf45");
    r(16, 26, 15, 8, "#24654a");
    r(7, 29, 11, 6, "#58a442");
    r(12, 38, 15, 4, "#1b4b40");
    r(10, 16, 4, 2, "#b2d66b");
    r(24, 20, 4, 2, "#83c455");
  } else if (id === "cloud") {
    [c, ctx] = surface(64, 24);
    r = pen(ctx);
    r(5, 15, 55, 7, "#9dabd5");
    r(1, 13, 61, 6, white);
    r(8, 7, 48, 11, white);
    r(16, 3, 28, 14, white);
    r(24, 0, 13, 8, white);
    r(8, 18, 46, 3, "#d0d8ed");
    r(43, 11, 12, 3, "#e3e6ed");
  } else if (id === "star") {
    [c, ctx] = surface(16, 16);
    r = pen(ctx);
    const rows = [
      ".......##.......",
      "......#yy#......",
      "......#yw#......",
      ".#####yyy#####..",
      ".#yyyyywyyyyy#..",
      "..#yyyyyyyyy#...",
      "...#yyiyiy##....",
      "...#yyyyyy#.....",
      "...#yyyyyy#.....",
      "..#yyyyyyyy#....",
      "..#yyy##yyy#....",
      "..#yy#..#yy#....",
      "...##....##.....",
    ];
    const colors = { "#": ink, y: "#ffcb47", w: "#fff4ac", i: "#74413b" };
    rows.forEach((row, y) =>
      [...row].forEach((v, x) => {
        if (colors[v]) r(x, y, 1, 1, colors[v]);
      }),
    );
  } else if (id === "banana") {
    [c, ctx] = surface(16, 16);
    r = pen(ctx);
    r(10, 1, 3, 3, ink);
    r(10, 4, 3, 6, "#e3972c");
    r(8, 7, 4, 6, "#f5c83f");
    r(4, 10, 6, 4, "#e3972c");
    r(2, 9, 3, 3, "#774336");
    r(4, 9, 5, 3, "#ffe478");
    r(8, 5, 3, 6, "#ffe478");
    r(8, 12, 3, 2, ink);
  } else if (id === "slime") {
    [c, ctx] = surface(16, 16);
    r = pen(ctx);
    r(4, 4, 9, 3, ink);
    r(2, 7, 13, 7, ink);
    r(3, 7, 11, 6, "#4fa352");
    r(5, 5, 6, 4, "#95d45a");
    r(4, 7, 3, 2, "#dbf3a0");
    r(5, 10, 2, 2, ink);
    r(11, 10, 2, 2, ink);
    r(3, 13, 11, 1, "#267044");
  } else if (id === "lantern") {
    [c, ctx] = surface(16, 24);
    r = pen(ctx);
    r(6, 0, 5, 3, ink);
    r(4, 3, 9, 3, "#aa6540");
    r(3, 6, 11, 15, ink);
    r(4, 7, 9, 12, "#dc9339");
    r(6, 8, 5, 9, "#ffde73");
    r(7, 10, 3, 5, white);
    r(3, 20, 11, 3, "#9a583f");
  } else if (id === "house") {
    [c, ctx] = surface(64, 56);
    r = pen(ctx);
    r(9, 24, 47, 32, ink);
    r(11, 26, 43, 28, "#d5ac70");
    r(12, 28, 20, 25, "#f0d39a");
    for (let y = 29; y < 53; y += 7) r(12, y, 41, 1, "#b18358");
    for (let y = 0; y < 25; y++) {
      let left = Math.max(0, 28 - y);
      r(left, y, 64 - left * 2, 1, ink);
      if (y > 2)
        r(left + 3, y, 58 - left * 2, 1, y % 5 === 0 ? "#9c3f4a" : "#d86051");
    }
    r(29, 37, 13, 19, ink);
    r(31, 39, 9, 17, "#865446");
    r(36, 47, 2, 2, "#ffd16a");
    r(15, 32, 10, 11, ink);
    r(16, 33, 8, 8, "#5cafcb");
    r(20, 33, 1, 8, white);
    r(16, 36, 8, 1, white);
    r(47, 6, 5, 13, "#ad5d50");
  } else if (id === "rock") {
    [c, ctx] = surface(24, 24);
    r = pen(ctx);
    r(6, 1, 12, 3, ink);
    r(3, 4, 19, 16, ink);
    r(1, 8, 23, 10, ink);
    r(6, 20, 13, 3, ink);
    r(5, 4, 14, 16, "#8175a4");
    r(3, 8, 18, 8, "#8175a4");
    r(6, 4, 10, 3, "#b9a6c7");
    r(4, 8, 4, 7, "#a79abc");
    r(13, 15, 7, 5, "#54476e");
    r(8, 9, 2, 3, ink);
    r(15, 9, 2, 3, ink);
    r(10, 17, 3, 1, ink);
  } else if (id === "pot") {
    [c, ctx] = surface(16, 24);
    r = pen(ctx);
    r(7, 7, 2, 7, "#3c814b");
    r(4, 8, 4, 2, "#77b84a");
    r(8, 5, 4, 2, "#77b84a");
    r(5, 1, 6, 7, "#e97482");
    r(3, 3, 10, 3, "#e97482");
    r(6, 3, 4, 3, "#ffe475");
    r(2, 13, 12, 4, ink);
    r(3, 14, 10, 2, "#e89a59");
    r(4, 17, 8, 6, "#b96b46");
    r(4, 22, 8, 2, ink);
    r(5, 17, 2, 4, "#df9157");
  } else if (id === "kart") {
    [c, ctx] = surface(24, 32);
    r = pen(ctx);
    r(2, 6, 4, 8, ink);
    r(19, 6, 4, 8, ink);
    r(2, 23, 4, 8, ink);
    r(19, 23, 4, 8, ink);
    r(6, 2, 13, 29, ink);
    r(5, 5, 15, 23, "#a83954");
    r(7, 3, 11, 25, "#e76562");
    r(8, 9, 9, 10, ink);
    r(9, 10, 7, 7, "#80ccd9");
    r(8, 4, 3, 3, "#ffe894");
    r(15, 4, 3, 3, "#ffe894");
    r(9, 21, 7, 5, "#f4c35b");
  } else if (id === "unicorn") {
    [c, ctx] = surface(40, 32);
    r = pen(ctx);
    r(8, 13, 21, 13, ink);
    r(9, 14, 19, 10, "#d2cae8");
    r(9, 14, 18, 7, white);
    r(27, 6, 8, 18, ink);
    r(28, 7, 6, 17, white);
    r(28, 5, 9, 8, white);
    r(32, 7, 2, 2, ink);
    r(31, 0, 2, 6, "#ffd36f");
    r(23, 7, 5, 16, "#b68dd5");
    r(8, 24, 4, 6, "#b6accb");
    r(24, 24, 4, 6, "#b6accb");
    r(3, 15, 6, 3, "#ea80a1");
    r(0, 18, 8, 3, "#a989d1");
    r(13, 7, 4, 12, "#7baed1");
    r(17, 10, 4, 11, "#a6d7e8");
    r(21, 13, 3, 7, white);
  } else if (id === "mountain") {
    [c, ctx] = surface(96, 80);
    r = pen(ctx);
    for (let y = 0; y < 80; y++) {
      const w = Math.floor(y * 0.62);
      r(48 - w, y, w * 2 + 1, 1, "#565486");
      r(48, y, w + 1, 1, "#383d70");
      if (y < 27) {
        r(48 - w, y, w * 2 + 1, 1, y < 17 ? "#f4e7dd" : "#bdbbdd");
        if (y > 17 && y % 5 < 2) r(48 - w, y, Math.max(1, w - 6), 1, "#8b89b8");
      }
    }
    for (let y = 35; y < 77; y += 7)
      r(49, y, Math.floor(y * 0.35), 1, "#41457a");
  }
  cache.set(key, c);
  return c;
}
export function tile(id) {
  const key = "tile:" + id;
  if (cache.has(key)) return cache.get(key);
  const [c, ctx] = surface(16, 16),
    r = pen(ctx);
  const stone = id === "stone",
    path = id === "path";
  r(0, 0, 16, 16, stone ? "#4c436b" : path ? "#c09156" : "#276c46");
  if (id === "lawn") {
    r(0, 0, 16, 16, "#4a934a");
    r(2, 3, 1, 2, "#6ebd58");
    r(3, 4, 2, 1, "#6ebd58");
    r(11, 10, 1, 2, "#2b7747");
    r(12, 11, 2, 1, "#2b7747");
    r(7, 14, 2, 1, "#66a74b");
  } else if (stone) {
    r(0, 0, 16, 1, "#d9d8ef");
    r(0, 1, 16, 3, "#9e9fc5");
    r(1, 5, 6, 4, "#70648b");
    r(9, 5, 6, 4, "#83749c");
    r(0, 10, 4, 4, "#70648b");
    r(6, 10, 8, 4, "#83749c");
    r(1, 6, 4, 1, "#ab96ba");
    r(7, 11, 5, 1, "#ab96ba");
  } else if (path) {
    r(1, 2, 2, 1, "#dfb66f");
    r(8, 9, 4, 1, "#ad784b");
    r(12, 3, 1, 2, "#eacf8d");
    r(4, 13, 2, 1, "#ad784b");
  } else {
    r(0, 0, 16, 3, "#a3d95b");
    r(0, 3, 16, 3, "#4bab48");
    r(2, 5, 3, 2, "#4bab48");
    r(10, 5, 3, 3, "#4bab48");
    r(1, 9, 5, 4, "#895237");
    r(8, 8, 7, 4, "#9d6540");
    r(4, 13, 6, 3, "#895237");
    r(0, 15, 16, 1, "#472f37");
  }
  cache.set(key, c);
  return c;
}
export function portrait(id) {
  return `<img class="pixel-portrait" src="${sprite(id).toDataURL()}" alt="${FAMILY.find((f) => f.id === id)?.name || id} pixel sprite"/>`;
}
export function cover(kind, large = false) {
  const [c, ctx] = surface(256, 160),
    r = pen(ctx),
    put = (id, x, y, scale = 1) => {
      const s = sprite(id);
      ctx.drawImage(s, x, y, s.width * scale, s.height * scale);
    },
    ground = (y, style = "grass") => {
      for (let yy = y; yy < 160; yy += 16)
        for (let x = 0; x < 256; x += 16) ctx.drawImage(tile(style), x, yy);
    };
  const dark = ["space", "bricks", "rhythm"].includes(kind);
  r(
    0,
    0,
    256,
    160,
    dark ? "#242345" : kind === "forest" ? "#397e55" : "#718bd2",
  );
  if (!dark) {
    r(0, 70, 256, 90, "#a0b1df");
    put("cloud", 12, 20);
    put("cloud", 165, 38);
    put("mountain", 0, 48, 1.5);
    put("mountain", 120, 36, 1.5);
  } else
    for (let k = 0; k < 50; k++)
      r(
        (k * 67) % 256,
        (k * 37) % 155,
        k % 4 === 0 ? 2 : 1,
        1,
        k % 2 ? "#8374aa" : "#d9d6ee",
      );
  if (large || kind === "mountain" || kind === "summit") {
    ground(128);
    for (let x = 148; x < 232; x += 16) ctx.drawImage(tile("stone"), x, 77);
    put("star", 149, 43);
    put("star", 105, 79);
    r(214, 43, 2, 34, ink);
    r(216, 43, 15, 10, "#ea6485");
    put("gaia", 45, 92);
    put("bean", 76, 92);
    if (large) {
      put("nur", 105, 90);
      put("arnaud", 133, 90);
      put("tree", 0, 77);
      put("tree", 219, 77);
    }
  }
  if (kind === "meadow") {
    ground(128);
    put("house", 179, 76);
    put("tree", -8, 73);
    put("gaia", 70, 91);
    put("bean", 106, 91);
    for (let k = 0; k < 4; k++)
      put("banana", 65 + k * 27, 58 - Math.sin(k) * 11);
    put("slime", 151, 112);
  }
  if (kind === "forest") {
    r(0, 0, 256, 160, "#286148");
    r(35, 20, 186, 130, "#4c964c");
    r(114, 23, 24, 137, "#c09156");
    r(35, 90, 186, 24, "#c09156");
    for (let x = 0; x < 256; x += 34) {
      put("tree", x, -20);
      put("tree", x, 119);
    }
    for (let y = 14; y < 120; y += 35) {
      put("tree", -9, y);
      put("tree", 225, y);
    }
    put("gaia", 88, 87);
    put("nur", 147, 49);
    put("bean", 145, 99);
    put("lantern", 58, 65);
    put("lantern", 174, 99);
  }
  if (kind === "rally") {
    r(0, 0, 256, 160, "#36894b");
    for (let y = 0; y < 160; y++) {
      const x = Math.round(90 + Math.sin(y / 43) * 20);
      r(x - 6, y, 99, 1, "#f5d6a0");
      r(x, y, 86, 1, "#615071");
      if (y % 18 < 10) r(x + 42, y, 2, 1, "#f6dba6");
    }
    put("kart", 119, 100, 1.5);
    put("banana", 99, 53);
    put("tree", 10, 36);
    put("tree", 205, 102);
  }
  if (kind === "bricks") {
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 7; x++) {
        const color = ["#e97077", "#d8ac59", "#62b6a0", "#9284d4"][y];
        r(19 + x * 32, 25 + y * 16, 28, 12, ink);
        r(20 + x * 32, 26 + y * 16, 26, 9, color);
        r(21 + x * 32, 27 + y * 16, 23, 1, white);
      }
    r(79, 135, 68, 9, ink);
    r(81, 135, 64, 3, "#bac7ee");
    r(81, 139, 64, 3, "#6b79ae");
    put("star", 162, 99);
    put("arnaud", 15, 119);
  }
  if (kind === "garden") {
    r(0, 0, 256, 160, "#276e49");
    for (let y = 18; y < 153; y += 22)
      for (let x = 63; x < 229; x += 22) {
        r(x, y, 21, 21, "#bfa065");
        r(x + 1, y + 1, 19, 1, "#eed396");
      }
    for (const [x, y] of [
      [85, 40],
      [129, 84],
      [195, 106],
    ]) {
      r(x, y, 20, 20, "#a94d73");
      put("pot", x + 2, y - 7);
    }
    put("nur", 96, 102);
    put("bean", 147, 103);
    put("tree", 7, 29);
    put("tree", 12, 107);
  }
  if (kind === "space") {
    r(182, 20, 35, 35, "#5f619c");
    r(187, 17, 24, 41, "#8a80ad");
    r(192, 22, 9, 7, "#b2a2c3");
    put("unicorn", 48, 84, 1.5);
    put("bean", 55, 70);
    for (let k = 0; k < 3; k++) put("rock", 172 + (k % 2) * 36, 78 + k * 22);
    put("star", 129, 98);
  }
  if (kind === "rhythm") {
    r(55, 10, 151, 150, "#433653");
    for (let k = 0; k < 3; k++) {
      r(65 + k * 46, 14, 38, 141, "#695170");
      r(65 + k * 46, 132, 38, 3, "#ffdc77");
      put("star", 75 + k * 46, 32 + k * 33);
    }
    put("gaia", 6, 111);
    put("nur", 218, 108);
    put("bean", 9, 75);
    put("arnaud", 218, 72);
  }
  return `<img class="pixel-cover" src="${c.toDataURL()}" alt="${large ? "Gaia, Bean, Nur and Arnaud in their pixel-art adventure" : kind + " pixel-art game scene"}"/>`;
}
