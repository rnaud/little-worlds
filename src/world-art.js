import { partyBackground } from "./party-art.js";
import { assetPath } from "./asset-path.js";
// World-specific raster assets. Every returned canvas uses native one-pixel art.
import { preparedGroup } from "./prepared-art.js";
import { quantize, keepMainComponent } from "./sprite-pipeline.js";
export const PARALLAX_KEYS = [
  "summit-sky",
  "summit-far",
  "summit-near",
  "meadow-sky",
  "meadow-far",
  "meadow-near",
];
const parallax = new Map();
export const parallaxFrame = (id) => parallax.get(id);
export const parallaxLayers = (id) =>
  ["sky", "far", "near"]
    .map((layer, n) => ({
      canvas: parallax.get(`${id}-${layer}`),
      speed: [0.035, 0.14, 0.32][n],
      name: layer,
    }))
    .filter((layer) => layer.canvas);
const SOURCE_WORLD_ORDER = [
  "summit",
  "meadow",
  "forest",
  "rally",
  "bricks",
  "garden",
  "space",
  "rhythm",
];
export const WORLD_ORDER = [
  ...SOURCE_WORLD_ORDER.filter((id) => id !== "rhythm"),
  "bubbles",
  "splash",
];
export const WORLDS = {
  bubbles: {
    name: "The Moonlit Soapworks",
    base: "#20374e",
    accent: "#9de0e2",
    material: "marble",
  },
  splash: {
    name: "The Splash Courtyards",
    base: "#9aa48b",
    accent: "#eac681",
    material: "terracotta",
  },
  summit: {
    name: "The Aurora Observatory",
    base: "#202442",
    accent: "#8be1e0",
    material: "frost",
  },
  meadow: {
    name: "The Banana Coast",
    base: "#edb789",
    accent: "#ffe08c",
    material: "coral",
  },
  forest: {
    name: "The Amberwood Sanctuary",
    base: "#123d42",
    accent: "#e7b66f",
    material: "moss",
  },
  rally: {
    name: "The Riviera Run",
    base: "#d9ba86",
    accent: "#ed785d",
    material: "marble",
  },
  bricks: {
    name: "The Clockwork Cosmos",
    base: "#131c37",
    accent: "#d7aa65",
    material: "brass",
  },
  garden: {
    name: "Mamma’s Glasshouse",
    base: "#c9b797",
    accent: "#89bc9a",
    material: "terracotta",
  },
  space: {
    name: "The Peach-Ring Nebula",
    base: "#191935",
    accent: "#e97bbe",
    material: "meteor",
  },
  rhythm: {
    name: "The Lotus Lantern Festival",
    base: "#241d3b",
    accent: "#efacb9",
    material: "cedar",
  },
};
const backgrounds = new Map(),
  props = new Map(),
  tiles = new Map();
export const artStatus = { loaded: false, error: null };
function surface(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}
// Median-cut color reduction is done once on load, never during animation.
function limitPalette(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h),
    data = img.data,
    hist = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const key =
      ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
    hist.set(key, (hist.get(key) || 0) + 1);
  }
  let buckets = [
    [...hist].map(([key, n]) => ({
      c: [
        ((key >> 10) & 31) * 8 + 4,
        ((key >> 5) & 31) * 8 + 4,
        (key & 31) * 8 + 4,
      ],
      n,
    })),
  ];
  const range = (b) =>
    [0, 1, 2].map(
      (a) =>
        Math.max(...b.map((p) => p.c[a])) - Math.min(...b.map((p) => p.c[a])),
    );
  while (buckets.length < 32) {
    let index = -1,
      best = -1,
      axis = 0;
    buckets.forEach((b, i) => {
      if (b.length < 2) return;
      const r = range(b),
        m = Math.max(...r);
      const score = m * Math.sqrt(b.reduce((s, p) => s + p.n, 0));
      if (score > best) {
        best = score;
        index = i;
        axis = r.indexOf(m);
      }
    });
    if (index < 0) break;
    const b = buckets.splice(index, 1)[0].sort((a, b) => a.c[axis] - b.c[axis]);
    const half = b.reduce((s, p) => s + p.n, 0) / 2;
    let sum = 0,
      cut = 1;
    for (let j = 0; j < b.length - 1; j++) {
      sum += b[j].n;
      cut = j + 1;
      if (sum >= half) break;
    }
    buckets.push(b.slice(0, cut), b.slice(cut));
  }
  const palette = buckets.map((b) => {
    const total = b.reduce((s, p) => s + p.n, 0);
    return [0, 1, 2].map((a) =>
      Math.round(b.reduce((s, p) => s + p.c[a] * p.n, 0) / total),
    );
  });
  const nearest = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const key =
      ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
    let color = nearest.get(key);
    if (!color) {
      let best = Infinity;
      for (const p of palette) {
        const d =
          (p[0] - data[i]) ** 2 +
          (p[1] - data[i + 1]) ** 2 +
          (p[2] - data[i + 2]) ** 2;
        if (d < best) {
          best = d;
          color = p;
        }
      }
      nearest.set(key, color);
    }
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}
export async function loadWorldArt({ source = false } = {}) {
  for (const id of ["bubbles", "splash"])
    backgrounds.set(id, partyBackground(id));
  try {
    if (!source) {
      const ready = await preparedGroup("worlds");
      if (
        ready &&
        WORLD_ORDER.filter((id) => !["bubbles", "splash"].includes(id)).every(
          (id) => ready.get(id)?.[0],
        )
      ) {
        for (const id of WORLD_ORDER)
          if (ready.get(id)?.[0]) backgrounds.set(id, ready.get(id)[0]);
        const layers = await preparedGroup("parallax");
        if (layers)
          for (const key of PARALLAX_KEYS)
            if (layers.get(key)?.[0]) parallax.set(key, layers.get(key)[0]);
        if (!PARALLAX_KEYS.every((key) => parallax.has(key)))
          await loadParallaxSource();
        artStatus.loaded = true;
        artStatus.error = null;
        artStatus.prepared = true;
        return;
      }
    }
    const image = new Image();
    image.src = assetPath("/art/eight-worlds-v1.png");
    await image.decode();
    SOURCE_WORLD_ORDER.forEach((id, index) => {
      const [c, ctx] = surface(320, 180),
        w = image.naturalWidth / 2;
      const edges = [0, 333, 665, 978, 1330],
        row = Math.floor(index / 2),
        top = edges[row],
        h = edges[row + 1] - top;
      ctx.drawImage(image, (index % 2) * w, top, w, h, 0, 0, 320, 180);
      limitPalette(ctx, 320, 180);
      // Suppress incidental single-pixel noise; keep deliberate larger clusters.
      const pixels = ctx.getImageData(0, 0, 320, 180),
        before = new Uint8ClampedArray(pixels.data);
      const same = (a, b) =>
        before[a] === before[b] &&
        before[a + 1] === before[b + 1] &&
        before[a + 2] === before[b + 2];
      for (let y = 1; y < 179; y++)
        for (let x = 1; x < 319; x++) {
          const at = (y * 320 + x) * 4,
            neighbors = [at - 4, at + 4, at - 1280, at + 1280];
          for (const n of neighbors)
            if (neighbors.filter((k) => same(n, k)).length >= 3) {
              pixels.data.set(before.subarray(n, n + 3), at);
              break;
            }
        }
      // Scenery stays behind the bright, interactive plane in value as well as depth.
      const light = {
        summit: 0.72,
        meadow: 0.86,
        forest: 0.82,
        rally: 0.93,
        bricks: 0.75,
        garden: 0.9,
        space: 0.76,
        rhythm: 0.8,
      }[id];
      for (let k = 0; k < pixels.data.length; k += 4)
        for (let channel = 0; channel < 3; channel++)
          pixels.data[k + channel] = Math.round(
            pixels.data[k + channel] * light,
          );
      ctx.putImageData(pixels, 0, 0);
      backgrounds.set(id, c);
    });
    await loadParallaxSource();
    artStatus.loaded = true;
  } catch (e) {
    artStatus.error = String(e);
    console.warn("World artwork unavailable; using native fallback scenes.", e);
  }
}
async function loadParallaxSource() {
  try {
    const image = new Image();
    image.src = assetPath("/art/platform-parallax-v1.png");
    await image.decode();
    const palettes = {
      summit: [
        ["#889fb4", "#94aabd", "#a2b7c7", "#b9cbd4", "#c9d7dc"],
        ["#70879f", "#8196ac", "#92a7b9", "#a7bac6"],
        ["#617e94", "#6e8aa0", "#809bad", "#96adbb"],
      ],
      meadow: [
        ["#b9cfc6", "#c6d8c9", "#d3dfcd", "#e0e6d3"],
        ["#85a6a7", "#96b4b0", "#a8c1b8", "#b6ccc0"],
        ["#648b88", "#789e95", "#8dae9e", "#a3bead"],
      ],
    };
    for (const [col, id] of ["summit", "meadow"].entries()) {
      for (const [row, layer] of ["sky", "far", "near"].entries()) {
        const [canvas, ctx] = surface(320, 180);
        if (row === 0) {
          ctx.fillStyle = palettes[id][row][0];
          ctx.fillRect(0, 0, 320, 180);
        }
        ctx.drawImage(
          image,
          (col * image.width) / 2,
          (row * image.height) / 3,
          image.width / 2,
          image.height / 3,
          0,
          0,
          320,
          180,
        );
        if (row > 0) keepMainComponent(ctx, 320, 180);
        quantize(
          ctx,
          320,
          180,
          palettes[id][row].map((hex) =>
            [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)),
          ),
        );
        // Remove source-sheet stippling without introducing blended pixels.
        // A majority vote chooses existing palette entries; alpha stays binary.
        for (let pass = 0; pass < (row === 0 ? 3 : 1); pass++) {
          const image = ctx.getImageData(0, 0, 320, 180),
            data = image.data,
            before = new Uint8ClampedArray(data);
          for (let y = 1; y < 179; y++)
            for (let x = 1; x < 319; x++) {
              const counts = new Map();
              let winner = (y * 320 + x) * 4,
                best = 0;
              for (let dy = -1; dy <= 1; dy++)
                for (let dx = -1; dx <= 1; dx++) {
                  const at = ((y + dy) * 320 + x + dx) * 4;
                  const key =
                    before[at] +
                    "," +
                    before[at + 1] +
                    "," +
                    before[at + 2] +
                    "," +
                    before[at + 3];
                  const count = (counts.get(key) || 0) + 1;
                  counts.set(key, count);
                  if (count > best) {
                    best = count;
                    winner = at;
                  }
                }
              if (best >= 5)
                data.set(
                  before.subarray(winner, winner + 4),
                  (y * 320 + x) * 4,
                );
            }
          ctx.putImageData(image, 0, 0);
        }
        parallax.set(`${id}-${layer}`, canvas);
      }
      const [composite, ctx] = surface(320, 180);
      for (const layer of ["sky", "far", "near"])
        ctx.drawImage(parallax.get(`${id}-${layer}`), 0, 0);
      backgrounds.set(id, composite);
    }
  } catch (error) {
    console.warn(
      "Parallax source unavailable; keeping the native world background.",
      error,
    );
  }
}
export function background(id) {
  return backgrounds.get(id);
}
export function worldCover(id) {
  if (id === "mountain") id = "summit";
  const source = background(id);
  if (!source) return null;
  const [c, ctx] = surface(256, 160);
  ctx.drawImage(source, 32, 10, 256, 160, 0, 0, 256, 160);
  return c;
}
export function worldTile(id) {
  if (id.endsWith("-body")) {
    if (tiles.has(id)) return tiles.get(id);
    const base = id.slice(0, -5),
      [c, ctx] = surface(16, 16);
    ctx.drawImage(worldTile(base), 0, 0);
    ctx.fillStyle = base === "frost" ? "#242844" : "#663954";
    ctx.fillRect(0, 0, 16, 6);
    ctx.fillStyle = base === "frost" ? "#4e5178" : "#b95a5e";
    ctx.fillRect(2, 1, 8, 2);
    ctx.fillRect(11, 3, 5, 2);
    tiles.set(id, c);
    return c;
  }

  const colors = {
    root: ["#142c35", "#433f3b", "#75664d", "#94ae79"],
    frost: ["#242844", "#4e5178", "#8facc6", "#def9ee"],
    coral: ["#663954", "#b95a5e", "#e99b68", "#fff0a0"],
    moss: ["#163d42", "#215459", "#387378", "#649b88"],
    marble: ["#876856", "#bda887", "#e1c995", "#fff1c2"],
    terracotta: ["#75484c", "#a8665b", "#d89979", "#f1cba1"],
    cedar: ["#29233d", "#44314b", "#6d405c", "#bf7890"],
    brass: ["#38293d", "#725047", "#b88858", "#f1ce8f"],
    meteor: ["#2c254b", "#55386d", "#955889", "#e394b6"],
  }[id];
  if (!colors) return null;
  if (tiles.has(id)) return tiles.get(id);
  const [c, ctx] = surface(16, 16),
    r = (x, y, w, h, col) => {
      ctx.fillStyle = colors[col];
      ctx.fillRect(x, y, w, h);
    };
  r(0, 0, 16, 16, 0);
  if (id === "frost") {
    r(0, 0, 16, 2, 3);
    r(0, 2, 16, 2, 2);
    r(3, 4, 3, 4, 2);
    r(11, 4, 2, 2, 2);
    r(0, 10, 7, 2, 1);
    r(8, 7, 6, 3, 1);
    r(6, 13, 8, 2, 1);
  } else if (id === "coral") {
    r(0, 0, 16, 3, 3);
    r(0, 3, 16, 3, 2);
    r(1, 7, 6, 4, 1);
    r(9, 6, 6, 5, 1);
    r(3, 12, 9, 3, 2);
    r(2, 8, 3, 1, 2);
  } else if (id === "root") {
    // Interlocking bark clusters, moss and one-pixel edges, rather than masonry.
    r(0, 0, 16, 16, 0);
    r(0, 1, 7, 6, 1);
    r(5, 3, 8, 6, 1);
    r(10, 0, 6, 5, 1);
    r(1, 10, 8, 6, 1);
    r(8, 8, 8, 6, 1);
    r(0, 2, 5, 1, 2);
    r(4, 3, 3, 1, 2);
    r(7, 4, 3, 1, 2);
    r(10, 5, 3, 2, 2);
    r(12, 0, 2, 3, 2);
    r(1, 11, 4, 1, 2);
    r(5, 12, 3, 1, 2);
    r(8, 11, 2, 2, 2);
    r(11, 9, 5, 1, 2);
    r(3, 5, 2, 2, 0);
    r(11, 12, 2, 3, 0);
    r(0, 0, 4, 2, 3);
    r(3, 0, 3, 1, 3);
    r(0, 8, 3, 2, 3);
    r(13, 6, 3, 2, 3);
    r(14, 5, 2, 1, 3);
    r(4, 14, 3, 2, 3);
  } else if (id === "moss") {
    r(0, 0, 16, 16, 1);
    r(2, 3, 4, 2, 2);
    r(3, 2, 2, 1, 2);
    r(10, 10, 4, 2, 0);
    r(11, 9, 2, 1, 0);
  } else {
    r(1, 1, 14, 14, 1);
    r(1, 1, 14, 1, 3);
    r(1, 2, 1, 12, 2);
    r(3, 4, 9, 1, 2);
    r(5, 11, 8, 1, 0);
  }
  tiles.set(id, c);
  return c;
}
export function prop(id) {
  if (props.has(id)) return props.get(id);
  const [c, ctx] = surface(32, 40),
    r = (x, y, w, h, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(x, y, w, h);
    };
  if (id === "crystal") {
    for (let y = 0; y < 29; y++) {
      const half = Math.min(7, Math.floor(y / 2) + 1, Math.floor((33 - y) / 2));
      r(15 - half, 5 + y, half * 2 + 1, 1, "#365a80");
      r(15 - half, 5 + y, half, 1, "#7dbfd1");
      r(15, 5 + y, 2, 1, "#d6ffed");
    }
    r(6, 33, 22, 3, "#242843");
  } else if (id === "palm") {
    r(15, 12, 4, 27, "#845348");
    r(16, 12, 2, 27, "#c08154");
    for (let y = 0; y < 5; y++)
      r(10 - y * 2, 5 + y * 2, 17 + y * 2, 2, y < 2 ? "#e4e27e" : "#3aab76");
    r(2, 16, 8, 3, "#23726c");
    r(23, 14, 8, 3, "#23726c");
    r(13, 15, 7, 4, "#b88348");
  } else if (id === "olive") {
    r(14, 23, 4, 16, "#77564b");
    r(5, 9, 22, 19, "#4a765e");
    r(2, 14, 28, 9, "#4a765e");
    r(6, 7, 18, 8, "#729475");
    r(8, 11, 7, 3, "#a8b47c");
    r(18, 18, 7, 3, "#2c5b53");
    r(11, 28, 12, 2, "#365a50");
  } else if (id === "lantern") {
    r(15, 0, 2, 10, "#7e6466");
    r(7, 8, 18, 3, "#bd9c78");
    r(9, 11, 14, 18, "#a95862");
    r(10, 12, 12, 15, "#f3b873");
    r(12, 13, 4, 12, "#ffe9a8");
    r(8, 28, 16, 3, "#715062");
    r(15, 31, 2, 7, "#cb7d83");
  } else if (id === "succulent") {
    r(8, 25, 17, 11, "#a8665b");
    r(6, 24, 21, 3, "#e6b092");
    r(13, 5, 6, 21, "#70a393");
    r(6, 13, 7, 9, "#437f78");
    r(20, 11, 7, 10, "#437f78");
    r(8, 11, 3, 9, "#96c5a0");
    r(14, 4, 3, 13, "#b5d1a5");
    r(22, 9, 3, 9, "#96c5a0");
  } else if (id === "lotus") {
    r(3, 31, 26, 3, "#286568");
    r(6, 29, 21, 3, "#398780");
    r(18, 28, 9, 2, "#4d9c86");
    const flower = [
      "........4........",
      ".......434.......",
      "...3...434...3...",
      "..323.34343.323..",
      "..3233444443323..",
      "...23344444332...",
      "....233444332....",
      ".....2233322.....",
      "......55555......",
    ];
    const palette = { 2: "#95456e", 3: "#ce7199", 4: "#f4b6c4", 5: "#f4d589" };
    flower.forEach((row, y) =>
      [...row].forEach((v, x) => {
        if (palette[v]) r(7 + x, 20 + y, 1, 1, palette[v]);
      }),
    );
  } else if (id === "gear") {
    for (let y = 4; y < 33; y++)
      for (let x = 2; x < 31; x++) {
        const dx = x - 16,
          dy = y - 19,
          d = dx * dx + dy * dy;
        if (d < 160 && d > 65) r(x, y, 1, 1, dy < -3 ? "#e2c182" : "#a47754");
      }
    r(13, 3, 6, 6, "#d1a76b");
    r(13, 31, 6, 6, "#a47754");
    r(0, 16, 6, 6, "#b38b5c");
    r(27, 16, 5, 6, "#b38b5c");
    r(14, 17, 4, 4, "#e2c182");
  }
  props.set(id, c);
  return c;
}
