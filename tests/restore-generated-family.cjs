// Repack the previously approved generated sprites without altering their pixels.
const { chromium } = require("playwright");
const fs = require("node:fs");
(async () => {
  const root = "assets/characters/generated/";
  const manifest = JSON.parse(fs.readFileSync(root + "prepared-v4.json"));
  const png = fs.readFileSync(root + "prepared-v4.png").toString("base64");
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
  });
  try {
    const page = await browser.newPage();
    const result = await page.evaluate(
      async ({ manifest, png }) => {
        const image = new Image();
        image.src = "data:image/png;base64," + png;
        await image.decode();
        const out = {
          version: 1,
          image: "atlas-v1.png",
          sourceCommit: "3b27527",
          groups: {},
        };
        let x = 0,
          y = 0,
          row = 0;
        for (const group of ["characters", "karts"]) {
          out.groups[group] = {};
          for (const [id, frames] of Object.entries(manifest.groups[group])) {
            out.groups[group][id] = frames.map((f) => {
              if (x + f.w > 512) {
                x = 0;
                y += row + 1;
                row = 0;
              }
              const cell = { x, y, w: f.w, h: f.h, source: f };
              x += f.w + 1;
              row = Math.max(row, f.h);
              return cell;
            });
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = y + row;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        for (const group of Object.values(out.groups))
          for (const frames of Object.values(group))
            for (const f of frames) {
              const s = f.source;
              ctx.drawImage(image, s.x, s.y, s.w, s.h, f.x, f.y, f.w, f.h);
              delete f.source;
            }
        return { manifest: out, png: canvas.toDataURL().split(",")[1] };
      },
      { manifest, png },
    );
    fs.writeFileSync(
      "public/art/generated-family/atlas-v1.png",
      Buffer.from(result.png, "base64"),
    );
    fs.writeFileSync(
      "public/art/generated-family/manifest.json",
      JSON.stringify(result.manifest, null, 2) + "\n",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
