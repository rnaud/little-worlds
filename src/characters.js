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
  authored: "native-pixel-stencils",
};
const frames = new Map(),
  mini = new Map(),
  karts = new Map(),
  smallKarts = new Map(),
  kartVariants = new Map();
export async function loadCharacterArt() {
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
export function characterFrame(id, state, time) {
  return frames.get(id)?.[clipFrame(id, state, time)] || null;
}
export function characterVariant(id, state, time, width, height) {
  const frame = clipFrame(id, state, time);
  const canvas = (height < 26 ? mini : frames).get(id)?.[frame];
  return canvas ? { canvas, frame } : null;
}
export function kartVariant(id, frame, width, height) {
  const key = `${id}:${frame}:${width}:${height}`;
  if (kartVariants.has(key)) return kartVariants.get(key);
  const source = (width < 22 ? smallKarts : karts).get(id)?.[frame];
  if (!source) return null;
  // Only Mode 7 perspective requires projected raster sizes. Its two source
  // detail levels are native drawings; no filtered or large-image input exists.
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
    38 - source.height,
  );
  return c.toDataURL();
}
export function characterDebugFrames(id, small = false) {
  return (small ? mini : frames).get(id) || [];
}
export function kartDebugFrames(id) {
  return karts.get(id) || [];
}
