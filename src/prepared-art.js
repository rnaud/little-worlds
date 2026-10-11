import { assetPath } from "./asset-path.js";
import { surface } from "./sprite-pipeline.js";

// Runtime games load this small native atlas. Original imagegen sheets are retained
// separately, and the preparation command rebuilds the atlas after an art change.
let ready;
async function load() {
  if (!ready)
    ready = (async () => {
      const response = await fetch(assetPath("/art/native/manifest.json"));
      if (!response.ok) return null;
      const manifest = await response.json(),
        image = new Image();
      image.src = assetPath("/art/native/") + manifest.image;
      await image.decode();
      return { manifest, image };
    })().catch(() => null);
  return ready;
}
export async function preparedGroup(name) {
  const result = await load();
  if (!result?.manifest.groups[name]) return null;
  const output = new Map();
  for (const [id, rects] of Object.entries(result.manifest.groups[name])) {
    output.set(
      id,
      rects.map(({ x, y, w, h }) => {
        const [c, ctx] = surface(w, h);
        ctx.drawImage(result.image, x, y, w, h, 0, 0, w, h);
        return c;
      }),
    );
  }
  return output;
}
