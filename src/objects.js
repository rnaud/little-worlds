import { assetPath } from "./asset-path.js";
import {
  surface,
  bounds,
  keepMainComponent,
  quantize,
} from "./sprite-pipeline.js";
import { preparedGroup } from "./prepared-art.js";
export const OBJECT_SPECS = [
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
export const objectArtStatus = { loaded: false, error: null };
const frames = new Map(),
  variants = new Map();
const palette = [
  "#211a2b",
  "#3c3145",
  "#5e4258",
  "#805275",
  "#ad7290",
  "#e39b9e",
  "#f1c1b2",
  "#fff0d0",
  "#d2c09c",
  "#9c896d",
  "#625949",
  "#2b4940",
  "#3b663e",
  "#5d883e",
  "#8ba346",
  "#bbbf6a",
  "#2e5b65",
  "#3f8792",
  "#6abbc0",
  "#9fe1dc",
  "#d8f2dd",
  "#4e3d60",
  "#736491",
  "#a297bd",
  "#663d31",
  "#955036",
  "#c57449",
  "#e79d63",
  "#ffcc83",
  "#ffdc57",
  "#cb9e34",
  "#8e722b",
].map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
export async function loadObjectArt({ source = false } = {}) {
  variants.clear();
  try {
    if (!source) {
      const ready = await preparedGroup("objects");
      if (ready && OBJECT_SPECS.every(([id]) => ready.get(id)?.[0])) {
        for (const [id, list] of ready) frames.set(id, list[0]);
        objectArtStatus.loaded = true;
        objectArtStatus.prepared = true;
        objectArtStatus.error = null;
        return;
      }
    }
    const image = new Image();
    image.src = assetPath("/art/objects-v1.png");
    await image.decode();
    const cw = Math.floor(image.naturalWidth / 4),
      ch = Math.floor(image.naturalHeight / 4);
    for (const [index, [id, w, h]] of OBJECT_SPECS.slice(0, 16).entries()) {
      const [cell, cc] = surface(cw, ch);
      cc.drawImage(
        image,
        (index % 4) * cw,
        Math.floor(index / 4) * ch,
        cw,
        ch,
        0,
        0,
        cw,
        ch,
      );
      keepMainComponent(cc, cw, ch);
      const b = bounds(cc.getImageData(0, 0, cw, ch).data, cw, ch);
      if (!b) throw new Error(`${id}: empty object sprite`);
      if (id === "brass-paddle") b.h = Math.round(b.h * 0.65);
      const [c, ctx] = surface(w, h),
        scale = Math.min((w - 2) / b.w, (h - 2) / b.h),
        dw = Math.round(b.w * scale),
        dh = Math.round(b.h * scale);
      ctx.drawImage(
        cell,
        b.x,
        b.y,
        b.w,
        b.h,
        Math.round((w - dw) / 2),
        h - 1 - dh,
        dw,
        dh,
      );
      quantize(ctx, w, h, palette);
      frames.set(id, c);
    }
    const flora = new Image();
    flora.src = assetPath("/art/flora-v1.png");
    await flora.decode();
    // The generated atlas has an uneven gutter; these inspected bounds preserve roots and tassels.
    const regions = [
      [0, 0, 425, 550],
      [425, 0, 460, 550],
      [885, 0, 330, 550],
      [1215, 0, 371, 550],
      [0, 550, 450, 442],
      [450, 550, 420, 442],
      [870, 550, 355, 442],
      [1225, 550, 361, 442],
    ];
    for (const [index, [x, y, w, h]] of regions.entries()) {
      const [cell, cc] = surface(w, h);
      cc.drawImage(flora, x, y, w, h, 0, 0, w, h);
      keepMainComponent(cc, w, h);
      const b = bounds(cc.getImageData(0, 0, w, h).data, w, h),
        id = OBJECT_SPECS[16 + index][0];
      if (!b) throw new Error(`${id}: empty flora sprite`);
      const scale = Math.min(30 / b.w, 38 / b.h),
        dw = Math.round(b.w * scale),
        dh = Math.round(b.h * scale),
        [c, ctx] = surface(32, 40);
      ctx.drawImage(
        cell,
        b.x,
        b.y,
        b.w,
        b.h,
        Math.round((32 - dw) / 2),
        39 - dh,
        dw,
        dh,
      );
      quantize(ctx, 32, 40, palette);
      frames.set(id, c);
    }
    const expansion = new Image();
    expansion.src = assetPath("/art/expansion-v1.png");
    await expansion.decode();
    const ew = Math.floor(expansion.naturalWidth / 4),
      eh = Math.floor(expansion.naturalHeight / 2);
    for (const [index, [id, w, h]] of OBJECT_SPECS.slice(24).entries()) {
      const [cell, cc] = surface(ew, eh);
      cc.drawImage(
        expansion,
        (index % 4) * ew,
        Math.floor(index / 4) * eh,
        ew,
        eh,
        0,
        0,
        ew,
        eh,
      );
      keepMainComponent(cc, ew, eh);
      const b = bounds(cc.getImageData(0, 0, ew, eh).data, ew, eh);
      if (!b) throw new Error(`${id}: missing expansion object`);
      const [c, ctx] = surface(w, h),
        scale = Math.min((w - 2) / b.w, (h - 2) / b.h),
        dw = Math.round(b.w * scale),
        dh = Math.round(b.h * scale);
      ctx.drawImage(
        cell,
        b.x,
        b.y,
        b.w,
        b.h,
        Math.round((w - dw) / 2),
        h - 1 - dh,
        dw,
        dh,
      );
      quantize(ctx, w, h, palette);
      frames.set(id, c);
    }
    objectArtStatus.loaded = true;
    objectArtStatus.prepared = false;
    objectArtStatus.error = null;
  } catch (e) {
    objectArtStatus.error = String(e);
    console.warn("Object artwork:", e);
  }
}
export function objectFrame(id) {
  return frames.get(id) || null;
}
export function objectVariant(id, size = 1) {
  const source = frames.get(id);
  if (!source) return null;
  const w =
      typeof size === "number"
        ? Math.max(1, Math.round(source.width * size))
        : size.width,
    h =
      typeof size === "number"
        ? Math.max(1, Math.round(source.height * size))
        : size.height,
    key = `${id}:${w}:${h}`;
  if (variants.has(key)) return variants.get(key);
  const [c, ctx] = surface(w, h);
  ctx.drawImage(source, 0, 0, w, h);
  variants.set(key, c);
  return c;
}
