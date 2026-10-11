import { assetPath } from "./asset-path.js";
import {
  surface,
  bounds,
  keepMainComponent,
  quantize,
} from "./sprite-pipeline.js";
import { clipFrame } from "./animation.js";
import { preparedGroup } from "./prepared-art.js";
export const CHARACTER_IDS = ["gaia", "bean", "nur", "arnaud"];
export const CHARACTER_FRAME_COUNT = 37;
export const characterArtStatus = {
  loaded: false,
  characters: {},
  error: null,
};
const frames = new Map(),
  variants = new Map();
const karts = new Map(),
  kartVariants = new Map();
const humanPalette = [
  "#20192d",
  "#373047",
  "#554058",
  "#795662",
  "#ad7b70",
  "#d8a080",
  "#f1bd94",
  "#ffe0b3",
  "#f8edd1",
  "#293749",
  "#405469",
  "#617786",
  "#254966",
  "#397a9b",
  "#69afd0",
  "#a5d8e6",
  "#713545",
  "#a94d60",
  "#dc6c78",
  "#ef9a96",
  "#714c36",
  "#a67138",
  "#d4a044",
  "#f0c65b",
  "#ffe29a",
  "#493941",
  "#806052",
  "#b78b6b",
];
const beanPalette = [
  "#251e2c",
  "#483440",
  "#69454a",
  "#82564c",
  "#98684e",
  "#b3825f",
  "#ce9f77",
  "#dfb992",
  "#f0d2aa",
  "#fae4c5",
  "#2a5356",
  "#447e79",
  "#6aa494",
  "#d5dfbd",
  "#1e2332",
  "#f4eee0",
];
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const paletteRGB = {
  gaia: humanPalette.map(rgb),
  nur: humanPalette.map(rgb),
  arnaud: humanPalette.map(rgb),
  bean: beanPalette.map(rgb),
};
async function loadCharacter(id) {
  const image = new Image();
  image.src = assetPath(`/art/characters/${id}-v2.png`);
  await image.decode();
  const cw = Math.floor(image.naturalWidth / 4),
    ch = Math.floor(image.naturalHeight / 4),
    cells = [];
  for (let frame = 0; frame < 16; frame++) {
    const [c, ctx] = surface(cw, ch);
    ctx.drawImage(
      image,
      (frame % 4) * cw,
      Math.floor(frame / 4) * ch,
      cw,
      ch,
      0,
      0,
      cw,
      ch,
    );
    keepMainComponent(ctx, cw, ch);
    const d = ctx.getImageData(0, 0, cw, ch).data,
      b = bounds(d, cw, ch);
    if (!b) throw new Error(`${id}: empty frame ${frame}`);
    let transparent = 0;
    for (let k = 3; k < d.length; k += 4) if (d[k] === 0) transparent++;
    if (transparent / (cw * ch) < 0.15)
      throw new Error(
        `${id}: frame ${frame} does not have a transparent background`,
      );
    cells.push({ c, b });
  }
  // A single scale across the sheet preserves crouch, airborne and stretched poses.
  const heights = cells
      .slice(0, 8)
      .map((c) => c.b.h)
      .sort((a, b) => a - b),
    median = (heights[3] + heights[4]) / 2;
  const scale = (id === "bean" ? 18 : 30) / median;
  const output = [];
  for (let frame = 0; frame < 16; frame++) {
    const { c, b } = cells[frame],
      [out, ctx] = surface(id === "bean" ? 40 : 32, 40);
    const w = Math.min(out.width - 2, Math.round(b.w * scale)),
      h = Math.min(36, Math.round(b.h * scale));
    const airborne = [9, 10, 11].includes(frame) && id !== "bean";
    const x = Math.round((out.width - w) / 2),
      y = airborne ? Math.max(2, 8) : 38 - h;
    ctx.drawImage(c, b.x, b.y, b.w, b.h, x, y, w, h);
    quantize(ctx, out.width, 40, paletteRGB[id]);
    output.push(out);
  }
  frames.set(id, output);
  characterArtStatus.characters[id] = {
    frames: 16,
    nativeWidth: output[0].width,
    nativeHeight: 40,
  };
}
export async function loadCharacterArt({ source = false } = {}) {
  variants.clear();
  kartVariants.clear();
  if (!source) {
    const [people, cars] = await Promise.all([
      preparedGroup("characters"),
      preparedGroup("karts"),
    ]);
    if (
      people &&
      cars &&
      CHARACTER_IDS.every(
        (id) =>
          people.get(id)?.length === CHARACTER_FRAME_COUNT &&
          cars.get(id)?.length === 4,
      )
    ) {
      for (const id of CHARACTER_IDS) {
        frames.set(id, people.get(id));
        karts.set(id, cars.get(id));
        characterArtStatus.characters[id] = {
          frames: CHARACTER_FRAME_COUNT,
          kartFrames: 4,
          nativeWidth: people.get(id)[0].width,
          nativeHeight: 40,
        };
      }
      characterArtStatus.loaded = true;
      characterArtStatus.error = null;
      characterArtStatus.prepared = true;
      return;
    }
  }
  const results = await Promise.allSettled(CHARACTER_IDS.map(loadCharacter));
  const errors = results
    .filter((r) => r.status === "rejected")
    .map((r) => String(r.reason));
  for (const loader of [
    loadDirections,
    loadRiders,
    loadActions,
    loadSkills,
    loadKarts,
  ]) {
    try {
      await loader();
    } catch (e) {
      errors.push(String(e));
    }
  }
  characterArtStatus.loaded = errors.length === 0;
  characterArtStatus.prepared = false;
  characterArtStatus.error = errors.length ? errors.join("; ") : null;
  if (errors.length) console.warn("Character artwork errors:", errors);
}
async function loadSkills() {
  const image = new Image();
  image.src = assetPath("/art/characters/skills-v2.png");
  await image.decode();
  const cw = Math.floor(image.naturalWidth / 6),
    ch = Math.floor(image.naturalHeight / 4);
  for (const [row, id] of CHARACTER_IDS.entries()) {
    const output = frames.get(id);
    if (!output) continue;
    const cells = [];
    for (let col = 0; col < 6; col++) {
      const [c, ctx] = surface(cw, ch);
      ctx.drawImage(image, col * cw, row * ch, cw, ch, 0, 0, cw, ch);
      keepMainComponent(ctx, cw, ch);
      const b = bounds(ctx.getImageData(0, 0, cw, ch).data, cw, ch);
      if (!b) throw new Error(`${id}: missing skill ${col}`);
      cells.push({ c, b });
    }
    const scale =
      (id === "bean" ? 22 : 32) /
      Math.max(...cells.slice(0, 4).map(({ b }) => b.h));
    for (const { c, b } of cells) {
      const [out, ctx] = surface(id === "bean" ? 40 : 32, 40),
        w = Math.min(out.width - 2, Math.round(b.w * scale)),
        h = Math.min(37, Math.round(b.h * scale));
      ctx.drawImage(
        c,
        b.x,
        b.y,
        b.w,
        b.h,
        Math.round((out.width - w) / 2),
        38 - h,
        w,
        h,
      );
      quantize(ctx, out.width, 40, paletteRGB[id]);
      output.push(out);
    }
    characterArtStatus.characters[id].frames = output.length;
  }
}
async function loadActions() {
  const image = new Image();
  image.src = assetPath("/art/characters/actions-v2.png");
  await image.decode();
  const cw = Math.floor(image.naturalWidth / 5),
    ch = Math.floor(image.naturalHeight / 4);
  for (const [row, id] of CHARACTER_IDS.entries()) {
    const output = frames.get(id);
    if (!output) continue;
    const cells = [];
    for (let col = 0; col < 5; col++) {
      const [c, ctx] = surface(cw, ch);
      ctx.drawImage(image, col * cw, row * ch, cw, ch, 0, 0, cw, ch);
      keepMainComponent(ctx, cw, ch);
      const b = bounds(ctx.getImageData(0, 0, cw, ch).data, cw, ch);
      if (!b) throw new Error(`${id}: missing action ${col}`);
      cells.push({ c, b });
    }
    const scale = (id === "bean" ? 20 : 30) / cells[1].b.h;
    for (const { c, b } of cells) {
      const [out, ctx] = surface(id === "bean" ? 40 : 32, 40),
        w = Math.min(out.width - 2, Math.round(b.w * scale)),
        h = Math.min(37, Math.round(b.h * scale));
      ctx.drawImage(
        c,
        b.x,
        b.y,
        b.w,
        b.h,
        Math.round((out.width - w) / 2),
        38 - h,
        w,
        h,
      );
      quantize(ctx, out.width, 40, paletteRGB[id]);
      output.push(out);
    }
    characterArtStatus.characters[id].frames = output.length;
  }
}
async function loadRiders() {
  const image = new Image();
  image.src = assetPath("/art/characters/riders-v2.png");
  await image.decode();
  const cw = Math.floor(image.naturalWidth / 4),
    ch = Math.floor(image.naturalHeight / 4);
  for (const [row, id] of CHARACTER_IDS.entries()) {
    const output = frames.get(id);
    if (!output) continue;
    const cells = [];
    for (let col = 0; col < 4; col++) {
      const [c, ctx] = surface(cw, ch);
      ctx.drawImage(image, col * cw, row * ch, cw, ch, 0, 0, cw, ch);
      keepMainComponent(ctx, cw, ch);
      const b = bounds(ctx.getImageData(0, 0, cw, ch).data, cw, ch);
      if (!b) throw new Error(`${id}: empty riding frame ${col}`);
      cells.push({ c, b });
    }
    const scale = (id === "bean" ? 23 : 28) / cells[0].b.h;
    for (const { c, b } of cells) {
      const [out, ctx] = surface(id === "bean" ? 40 : 32, 40),
        w = Math.min(out.width - 2, Math.round(b.w * scale)),
        h = Math.min(34, Math.round(b.h * scale));
      ctx.drawImage(
        c,
        b.x,
        b.y,
        b.w,
        b.h,
        Math.round((out.width - w) / 2),
        38 - h,
        w,
        h,
      );
      quantize(ctx, out.width, 40, paletteRGB[id]);
      output.push(out);
    }
    characterArtStatus.characters[id].frames = output.length;
  }
}
async function loadKarts() {
  const image = new Image();
  image.src = assetPath("/art/characters/karts-rear-v3.png");
  await image.decode();
  const cw = Math.floor(image.naturalWidth / 4),
    ch = Math.floor(image.naturalHeight / 4);
  for (const [row, id] of CHARACTER_IDS.entries()) {
    const cells = [];
    for (let col = 0; col < 4; col++) {
      const [c, ctx] = surface(cw, ch);
      ctx.drawImage(image, col * cw, row * ch, cw, ch, 0, 0, cw, ch);
      keepMainComponent(ctx, cw, ch);
      const b = bounds(ctx.getImageData(0, 0, cw, ch).data, cw, ch);
      if (!b) throw new Error(`${id}: missing kart ${col}`);
      cells.push({ c, b });
    }
    const scale = Math.min(
      28 / Math.max(...cells.map(({ b }) => b.w)),
      35 / Math.max(...cells.map(({ b }) => b.h)),
    );
    karts.set(
      id,
      cells.map(({ c, b }, col) => {
        const [out, ctx] = surface(32, 40),
          w = Math.round(b.w * scale),
          h = Math.round(b.h * scale);
        ctx.drawImage(
          c,
          b.x,
          b.y,
          b.w,
          b.h,
          Math.round((32 - w) / 2),
          (col === 3 ? 38 : 33) - h,
          w,
          h,
        );
        quantize(ctx, 32, 40, humanPalette.map(rgb));
        return out;
      }),
    );
    if (characterArtStatus.characters[id])
      characterArtStatus.characters[id].kartFrames = 4;
  }
}
export function kartVariant(id, frame, width, height) {
  const key = `${id}:${frame}:${width}:${height}`;
  if (kartVariants.has(key)) return kartVariants.get(key);
  const source = karts.get(id)?.[frame];
  if (!source) return null;
  const [c, ctx] = surface(width, height);
  ctx.drawImage(source, 0, 0, width, height);
  kartVariants.set(key, c);
  return c;
}
async function loadDirections() {
  const image = new Image();
  image.src = assetPath("/art/characters/directions-v2.png");
  await image.decode();
  const cw = Math.floor(image.naturalWidth / 6),
    ch = Math.floor(image.naturalHeight / 4);
  for (const [row, id] of CHARACTER_IDS.entries()) {
    const output = frames.get(id);
    if (!output) continue;
    const cells = [];
    for (let col = 0; col < 6; col++) {
      const [c, ctx] = surface(cw, ch);
      ctx.drawImage(image, col * cw, row * ch, cw, ch, 0, 0, cw, ch);
      keepMainComponent(ctx, cw, ch);
      const b = bounds(ctx.getImageData(0, 0, cw, ch).data, cw, ch);
      if (!b) throw new Error(`${id}: empty directional frame ${col}`);
      cells.push({ c, b });
    }
    const scale =
      (id === "bean" ? 20 : 30) / ((cells[0].b.h + cells[3].b.h) / 2);
    for (const { c, b } of cells) {
      const [out, ctx] = surface(id === "bean" ? 40 : 32, 40);
      const w = Math.min(out.width - 2, Math.round(b.w * scale)),
        h = Math.min(36, Math.round(b.h * scale));
      ctx.drawImage(
        c,
        b.x,
        b.y,
        b.w,
        b.h,
        Math.round((out.width - w) / 2),
        38 - h,
        w,
        h,
      );
      quantize(ctx, out.width, 40, paletteRGB[id]);
      output.push(out);
    }
    characterArtStatus.characters[id].frames = output.length;
  }
}
export function characterFrame(id, state, time) {
  return frames.get(id)?.[clipFrame(id, state, time)] || null;
}
export function characterVariant(id, state, time, width, height) {
  const frame = clipFrame(id, state, time),
    key = `${id}:${frame}:${width}:${height}`;
  if (variants.has(key)) return { canvas: variants.get(key), frame };
  const source = frames.get(id)?.[frame];
  if (!source) return null;
  const [c, ctx] = surface(width, height);
  ctx.drawImage(source, 0, 0, width, height);
  variants.set(key, c);
  return { canvas: c, frame };
}
export function characterPreview(id) {
  const source = characterFrame(id, "idle", 0);
  if (!source) return null;
  const [c, ctx] = surface(40, 40);
  ctx.drawImage(source, Math.round((40 - source.width) / 2), 0);
  return c.toDataURL();
}
export function characterDebugFrames(id) {
  return frames.get(id) || [];
}
export function kartDebugFrames(id) {
  return karts.get(id) || [];
}
