import { drawNativeCreature } from "./native-creatures.js";
import { drawingCanvas } from "./native-actors.js";
export const CREATURE_IDS = [
  "leaf-slime",
  "fern-spirit",
  "winged-unicorn",
  "crystal-rock",
];
export const creatureArtStatus = {
  loaded: false,
  error: null,
  frames: 0,
  authored: "native-pixel-stencils",
};
const sheets = new Map(),
  smallSheets = new Map();
export async function loadCreatureArt() {
  for (const id of CREATURE_IDS) {
    sheets.set(
      id,
      Array.from({ length: 4 }, (_, n) =>
        drawingCanvas(drawNativeCreature(id, n)),
      ),
    );
    smallSheets.set(
      id,
      Array.from({ length: 4 }, (_, n) =>
        drawingCanvas(drawNativeCreature(id, n, true)),
      ),
    );
  }
  creatureArtStatus.loaded = true;
  creatureArtStatus.frames = 16;
  creatureArtStatus.error = null;
}
export function creatureFrame(id, time = 0) {
  return (
    sheets.get(id)?.[Math.floor(time * (id === "crystal-rock" ? 3 : 8)) % 4] ||
    null
  );
}
export function creatureVariant(id, time, width, height) {
  const frame = Math.floor(time * (id === "crystal-rock" ? 3 : 8)) % 4,
    canvas = (
      width < (id === "winged-unicorn" ? 35 : 21) ? smallSheets : sheets
    ).get(id)?.[frame];
  return canvas ? { canvas, frame } : null;
}
export function creatureDebugFrames(id) {
  return sheets.get(id) || [];
}
