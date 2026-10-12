import { assetPath } from "./asset-path.js";
import { surface } from "./sprite-pipeline.js";
import { clipFrame } from "./animation.js";
import {
  drawNativeActor,
  drawNativeKart,
  drawingCanvas,
} from "./native-actors.js";
export const CHARACTER_IDS = ["gaia", "bean", "nur", "arnaud"];
export const CHARACTER_FRAME_COUNT = 37;
export const characterArtStatus = {
  loaded: false,
  characters: {},
  error: null,
  authored: "image-generated-sprite-sheets",
};
const frames = new Map(),
  mini = new Map(),
  karts = new Map(),
  smallKarts = new Map(),
  kartVariants = new Map();
function loadFallbackArt() {
  // No image decode, silhouette extraction, quantization or downscaling. Both
  // sizes are independent pixel drawings, shared by all cartridges and menus.
  for (const id of CHARACTER_IDS) {
    frames.set(
      id,
      Array.from({ length: CHARACTER_FRAME_COUNT }, (_, n) =>
        drawingCanvas(drawNativeActor(id, n)),
      ),
    );
    mini.set(
      id,
      Array.from({ length: CHARACTER_FRAME_COUNT }, (_, n) =>
        drawingCanvas(drawNativeActor(id, n, true)),
      ),
    );
    karts.set(
      id,
      Array.from({ length: 4 }, (_, n) => drawingCanvas(drawNativeKart(id, n))),
    );
    smallKarts.set(
      id,
      Array.from({ length: 4 }, (_, n) =>
        drawingCanvas(drawNativeKart(id, n, true)),
      ),
    );
    const c = frames.get(id)[0];
    characterArtStatus.characters[id] = {
      frames: CHARACTER_FRAME_COUNT,
      kartFrames: 4,
      nativeWidth: c.width,
      nativeHeight: c.height,
      smallWidth: mini.get(id)[0].width,
    };
  }
  kartVariants.clear();
  characterArtStatus.loaded = true;
  characterArtStatus.error = null;
  characterArtStatus.prepared = false;
}
// Reuse the approved generated designs. Regular frames retain every prepared
// source pixel; compact poses and Mode 7 projections use nearest-neighbor sampling.
let loading;
export function loadCharacterArt() {
  return (loading ||= loadGeneratedArt());
}
async function loadGeneratedArt() {
  try {
    const response = await fetch(
      assetPath("art/generated-family/manifest.json"),
    );
    if (!response.ok) throw new Error("Family atlas manifest unavailable");
    const manifest = await response.json();
    const image = new Image();
    image.src = assetPath("art/generated-family/" + manifest.image);
    await image.decode();
    const extract = (cell) => {
      const [c, ctx] = surface(cell.w, cell.h);
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
      return c;
    };
    const compact = (source) => {
      const [c, ctx] = surface(Math.round(source.width * 0.6), 24);
      ctx.drawImage(source, 0, 0, c.width, c.height);
      return c;
    };
    for (const id of CHARACTER_IDS) {
      const actors = manifest.groups.characters[id];
      const racers = manifest.groups.karts[id];
      if (actors.length !== CHARACTER_FRAME_COUNT || racers.length !== 4)
        throw new Error("Incomplete family animation: " + id);
      frames.set(id, actors.map(extract));
      mini.set(id, frames.get(id).map(compact));
      karts.set(id, racers.map(extract));
      smallKarts.set(id, karts.get(id).map(compact));
      characterArtStatus.characters[id] = {
        frames: actors.length,
        kartFrames: racers.length,
        nativeWidth: actors[0].w,
        nativeHeight: actors[0].h,
        smallWidth: mini.get(id)[0].width,
      };
    }
    characterArtStatus.loaded = true;
    characterArtStatus.prepared = true;
    characterArtStatus.error = null;
    characterArtStatus.authored = "image-generated-sprite-sheets";
  } catch (error) {
    // A failed download must not prevent the family from opening a cartridge.
    loadFallbackArt();
    characterArtStatus.authored = "native-pixel-fallback";
    characterArtStatus.error = String(error);
  }
}
export function characterFrame(id, state, time) {
  return frames.get(id)?.[clipFrame(id, state, time)] || null;
}
export function characterVariant(id, state, time, width, height) {
  const frame = clipFrame(id, state, time);
  const compact = height < 26 || (id !== "bean" && state.startsWith("carry"));
  const canvas = (compact ? mini : frames).get(id)?.[frame];
  return canvas ? { canvas, frame } : null;
}
export function kartVariant(id, frame, width, height) {
  const key = `${id}:${frame}:${width}:${height}`;
  if (kartVariants.has(key)) return kartVariants.get(key);
  const source = (width < 22 ? smallKarts : karts).get(id)?.[frame];
  if (!source) return null;
  // Project the restored generated kart into the integer Mode 7 raster size.
  const [c, ctx] = surface(width, height);
  ctx.drawImage(source, 0, 0, width, height);
  kartVariants.set(key, c);
  return c;
}
export function characterPreview(id) {
  const source = characterFrame(id, "idle", 0);
  if (!source) return null;
  const [c, ctx] = surface(40, 40);
  ctx.drawImage(
    source,
    Math.floor((40 - source.width) / 2),
    40 - source.height,
  );
  return c.toDataURL();
}
export function characterDebugFrames(id, small = false) {
  return (small ? mini : frames).get(id) || [];
}
export function kartDebugFrames(id, small = false) {
  return (small ? smallKarts : karts).get(id) || [];
}
