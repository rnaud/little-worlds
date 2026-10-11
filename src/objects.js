import { NATIVE_OBJECT_SPECS, drawNativeObject } from "./native-objects.js";
import { drawingCanvas } from "./native-actors.js";
export const OBJECT_SPECS = NATIVE_OBJECT_SPECS;
export const objectArtStatus = {
  loaded: false,
  error: null,
  prepared: false,
  authored: "native-pixel-stencils",
};
const frames = new Map(),
  variants = new Map();
export async function loadObjectArt() {
  for (const [id] of OBJECT_SPECS)
    frames.set(id, drawingCanvas(drawNativeObject(id)));
  variants.clear();
  objectArtStatus.loaded = true;
  objectArtStatus.error = null;
}
export function objectFrame(id) {
  return frames.get(id) || null;
}
export function objectVariant(id, size = 1) {
  const source = frames.get(id);
  if (!source) return null;
  const width =
    typeof size === "number"
      ? Math.max(1, Math.round(source.width * size))
      : Math.max(1, Math.round(size.width));
  const height =
    typeof size === "number"
      ? Math.max(1, Math.round(source.height * size))
      : Math.max(1, Math.round(size.height));
  if (width === source.width && height === source.height) return source;
  const key = `${id}:${width}:${height}`;
  if (variants.has(key)) return variants.get(key);
  const canvas = drawingCanvas(drawNativeObject(id, width, height));
  variants.set(key, canvas);
  return canvas;
}
