import { assetPath } from "./asset-path.js";
import {
  surface,
  bounds,
  keepMainComponent,
  quantize,
} from "./sprite-pipeline.js";
import { preparedGroup } from "./prepared-art.js";

export const creatureArtStatus = { loaded: false, error: null, frames: 0 };
const sheets = new Map(),
  variants = new Map();
const palette = [
  "#20182d",
  "#403249",
  "#624267",
  "#805990",
  "#ac82c6",
  "#d0ace5",
  "#ecd3f0",
  "#fff0d0",
  "#e9c998",
  "#bc955f",
  "#876546",
  "#384c37",
  "#50733f",
  "#769844",
  "#a8be5a",
  "#d4d584",
  "#2d5660",
  "#458594",
  "#71b9bd",
  "#abe3d3",
  "#d7f4dc",
  "#773d2b",
  "#a34b2a",
  "#d86625",
  "#f58d32",
  "#ffb851",
  "#ffe08b",
  "#66336e",
  "#9b40ba",
  "#d363d7",
  "#ef99ec",
  "#ed7182",
].map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
const specs = [
  { id: "leaf-slime", w: 24, h: 24 },
  { id: "fern-spirit", w: 24, h: 24 },
  { id: "winged-unicorn", w: 40, h: 28 },
  { id: "crystal-rock", w: 24, h: 24 },
];
export async function loadCreatureArt({ source = false } = {}) {
  variants.clear();
  if (!source) {
    const ready = await preparedGroup("creatures");
    if (ready && specs.every((s) => ready.get(s.id)?.length === 4)) {
      for (const [id, frames] of ready) sheets.set(id, frames);
      creatureArtStatus.loaded = true;
      creatureArtStatus.error = null;
      creatureArtStatus.frames = 16;
      creatureArtStatus.prepared = true;
      return;
    }
  }
  try {
    const image = new Image();
    image.src = assetPath("/art/characters/creatures-v1.png");
    await image.decode();
    const cw = Math.floor(image.naturalWidth / 4),
      ch = Math.floor(image.naturalHeight / 4);
    for (const [row, spec] of specs.entries()) {
      const cells = [];
      for (let col = 0; col < 4; col++) {
        const [c, ctx] = surface(cw, ch);
        ctx.drawImage(image, col * cw, row * ch, cw, ch, 0, 0, cw, ch);
        keepMainComponent(ctx, cw, ch);
        const b = bounds(ctx.getImageData(0, 0, cw, ch).data, cw, ch);
        if (!b) throw new Error(`${spec.id}: empty frame ${col}`);
        cells.push({ c, b });
      }
      const scale = Math.min(
        (spec.w - 2) / Math.max(...cells.map(({ b }) => b.w)),
        (spec.h - 2) / Math.max(...cells.map(({ b }) => b.h)),
      );
      const output = cells.map(({ c, b }) => {
        const [out, ctx] = surface(spec.w, spec.h),
          w = Math.round(b.w * scale),
          h = Math.round(b.h * scale);
        // Ground creatures keep a baseline; flying creatures keep their body centered.
        const y = row < 2 ? spec.h - 1 - h : Math.round((spec.h - h) / 2);
        ctx.drawImage(
          c,
          b.x,
          b.y,
          b.w,
          b.h,
          Math.round((spec.w - w) / 2),
          y,
          w,
          h,
        );
        quantize(ctx, spec.w, spec.h, palette);
        return out;
      });
      sheets.set(spec.id, output);
    }
    creatureArtStatus.frames = 16;
    creatureArtStatus.loaded = true;
  } catch (e) {
    creatureArtStatus.error = String(e);
    console.warn("Creature artwork:", e);
  }
}
export function creatureFrame(id, time = 0) {
  return (
    sheets.get(id)?.[Math.floor(time * (id === "crystal-rock" ? 3 : 8)) % 4] ||
    null
  );
}
export function creatureVariant(id, time, width, height) {
  const frame = Math.floor(time * (id === "crystal-rock" ? 3 : 8)) % 4,
    key = `${id}:${frame}:${width}:${height}`;
  if (variants.has(key)) return { canvas: variants.get(key), frame };
  const source = sheets.get(id)?.[frame];
  if (!source) return null;
  const [canvas, ctx] = surface(width, height);
  ctx.drawImage(source, 0, 0, width, height);
  variants.set(key, canvas);
  return { canvas, frame };
}
export function creatureDebugFrames(id) {
  return sheets.get(id) || [];
}
export const CREATURE_IDS = specs.map((s) => s.id);
