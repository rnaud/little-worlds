// Run with the dev server available. Browser canvas uses the exact game pipeline.
const { chromium } = require("playwright");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXECUTABLE,
    headless: true,
  });
  const page = await browser.newPage();
  try {
    await page.goto(
      (process.env.ARCADE_URL || "http://127.0.0.1:5174") + "/sprite-lab.html",
    );
    const result = await page.evaluate(async () => {
      const chars = await import("/src/characters.js"),
        creatures = await import("/src/creatures.js"),
        worlds = await import("/src/world-art.js");
      const objects = await import("/src/objects.js");
      await Promise.all([
        chars.loadCharacterArt({ source: true }),
        creatures.loadCreatureArt({ source: true }),
        worlds.loadWorldArt({ source: true }),
        objects.loadObjectArt({ source: true }),
      ]);
      if (
        !chars.characterArtStatus.loaded ||
        !creatures.creatureArtStatus.loaded ||
        !worlds.artStatus.loaded ||
        !objects.objectArtStatus.loaded
      )
        throw new Error("Source artwork did not load");
      const sources = {
        parallax: Object.fromEntries(
          worlds.PARALLAX_KEYS.map((id) => [id, [worlds.parallaxFrame(id)]]),
        ),
        characters: Object.fromEntries(
          chars.CHARACTER_IDS.map((id) => [id, chars.characterDebugFrames(id)]),
        ),
        karts: Object.fromEntries(
          chars.CHARACTER_IDS.map((id) => [id, chars.kartDebugFrames(id)]),
        ),
        creatures: Object.fromEntries(
          creatures.CREATURE_IDS.map((id) => [
            id,
            creatures.creatureDebugFrames(id),
          ]),
        ),
        worlds: Object.fromEntries(
          worlds.WORLD_ORDER.map((id) => [id, [worlds.background(id)]]),
        ),
        objects: Object.fromEntries(
          objects.OBJECT_SPECS.map(([id]) => [id, [objects.objectFrame(id)]]),
        ),
      };
      const manifest = { version: 5, image: "arcade-v5.png", groups: {} },
        placements = [];
      let x = 0,
        y = 0,
        rowHeight = 0;
      const width = 1024;
      for (const [group, entries] of Object.entries(sources)) {
        manifest.groups[group] = {};
        for (const [id, frames] of Object.entries(entries)) {
          manifest.groups[group][id] = frames.map((c) => {
            if (x + c.width > width) {
              x = 0;
              y += rowHeight + 1;
              rowHeight = 0;
            }
            const rect = { x, y, w: c.width, h: c.height };
            placements.push({ c, rect });
            x += c.width + 1;
            rowHeight = Math.max(rowHeight, c.height);
            return rect;
          });
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = y + rowHeight;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      for (const { c, rect } of placements) ctx.drawImage(c, rect.x, rect.y);
      manifest.width = width;
      manifest.height = canvas.height;
      manifest.frameCount = placements.length;
      return { manifest, png: canvas.toDataURL("image/png").split(",")[1] };
    });
    fs.mkdirSync("public/art/native", { recursive: true });
    fs.writeFileSync(
      "public/art/native/arcade-v5.png",
      Buffer.from(result.png, "base64"),
    );
    fs.writeFileSync(
      "public/art/native/manifest.json",
      JSON.stringify(result.manifest, null, 2) + "\n",
    );
    console.log(
      JSON.stringify({
        frames: result.manifest.frameCount,
        width: result.manifest.width,
        height: result.manifest.height,
        bytes: Buffer.from(result.png, "base64").length,
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
