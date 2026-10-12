import { assetPath } from "./asset-path.js";
import { nativeScene, nativeLayers } from "./native-scenes.js";
import { partyBackground } from "./party-art.js";
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
export const artStatus = {
  loaded: false,
  error: null,
  prepared: false,
  authored: "native-pixel-stencils",
};
function surface(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}
export async function loadWorldArt() {
  for (const id of WORLD_ORDER)
    backgrounds.set(
      id,
      ["bubbles", "splash"].includes(id)
        ? partyBackground(id)
        : nativeScene(id),
    );
  for (const id of ["summit", "meadow"]) {
    const layers = nativeLayers(id);
    ["sky", "far", "near"].forEach((name, n) =>
      parallax.set(`${id}-${name}`, layers[n]),
    );
  }
  artStatus.loaded = true;
  artStatus.error = null;
  artStatus.authored = "native-pixel-stencils";
  artStatus.prepared = false;
  try {
    const response = await fetch(
      assetPath("art/generated-worlds/manifest.json"),
    );
    if (!response.ok) throw new Error("World atlas manifest unavailable");
    const manifest = await response.json();
    const image = new Image();
    image.src = assetPath("art/generated-worlds/" + manifest.image);
    await image.decode();
    const decoded = { worlds: new Map(), parallax: new Map() };
    for (const [group, ids] of Object.entries(manifest.groups)) {
      for (const [id, cells] of Object.entries(ids)) {
        const cell = cells[0],
          [c, ctx] = surface(cell.w, cell.h);
        ctx.drawImage(
          image,
          cell.x,
          cell.y,
          cell.w,
          cell.h,
          0,
          0,
          cell.w,
          cell.h,
        );
        decoded[group].set(id, c);
      }
    }
    if (
      !WORLD_ORDER.every((id) => decoded.worlds.has(id)) ||
      !PARALLAX_KEYS.every((id) => decoded.parallax.has(id))
    )
      throw new Error("Incomplete generated world atlas");
    for (const [id, c] of decoded.worlds) backgrounds.set(id, c);
    for (const [id, c] of decoded.parallax) parallax.set(id, c);
    artStatus.authored = "image-generated-pixel-worlds";
    artStatus.prepared = true;
  } catch (error) {
    // Keep the complete code-drawn environments when an asset is unavailable.
    artStatus.error = String(error);
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
