// Reproducible game-asset preparation: nearest sampling, binary alpha, 32 colors.
// Full generated originals and prompts remain archived outside public/.
const fs = require("node:fs");
const { chromium } = require("playwright");
(async () => {
  const ids = [
    "summit",
    "meadow",
    "forest",
    "rally",
    "bricks",
    "garden",
    "space",
    "bubbles",
    "splash",
  ];
  const sources = Object.fromEntries(
    ids.map((id) => [
      id,
      fs
        .readFileSync("assets/worlds/generated-v1/" + id + ".png")
        .toString("base64"),
    ]),
  );
  sources["meadow-sky"] = fs
    .readFileSync("assets/worlds/generated-v1/meadow-sky.png")
    .toString("base64");
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
  });
  try {
    const page = await browser.newPage();
    const result = await page.evaluate(async (sources) => {
      const surface = () => {
        const c = document.createElement("canvas");
        c.width = 320;
        c.height = 180;
        const ctx = c.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        return [c, ctx];
      };
      const manifest = {
        version: 1,
        image: "atlas-v1.png",
        groups: { worlds: {}, parallax: {} },
        palettes: {},
      };
      const frames = [];
      for (const [id, base64] of Object.entries(sources)) {
        if (id === "meadow-sky") continue;
        const image = new Image();
        image.src = "data:image/png;base64," + base64;
        await image.decode();
        const layered = id === "summit" || id === "meadow",
          canvases = [];
        for (let layer = 0; layer < (layered ? 3 : 1); layer++) {
          const [c, ctx] = surface();
          if (layer === 0) {
            ctx.fillStyle =
              id === "summit"
                ? "#55547f"
                : id === "meadow"
                  ? "#e5a362"
                  : "#172d3a";
            ctx.fillRect(0, 0, 320, 180);
          }
          const offset = layer === 1 ? 12 : layer === 2 ? 38 : 0;
          ctx.drawImage(
            image,
            0,
            (layer * image.height) / (layered ? 3 : 1),
            image.width,
            image.height / (layered ? 3 : 1),
            0,
            offset,
            320,
            180,
          );
          if (id === "meadow" && layer === 0) {
            const sky = new Image();
            sky.src = "data:image/png;base64," + sources["meadow-sky"];
            await sky.decode();
            ctx.drawImage(sky, 0, 0, 320, 180);
          }
          const data = ctx.getImageData(0, 0, 320, 180),
            d = data.data;
          for (let i = 0; i < d.length; i += 4) {
            d[i + 3] = d[i + 3] >= 128 ? 255 : 0;
            // Atmospheric distance compresses the contrast of scenery behind platforms.
            if (layered && layer > 0 && d[i + 3]) {
              const fog = id === "summit" ? [91, 103, 143] : [137, 164, 157],
                amount =
                  id === "meadow"
                    ? layer === 1
                      ? 0.38
                      : 0.55
                    : layer === 1
                      ? 0.28
                      : 0.4;
              for (let k = 0; k < 3; k++)
                d[i + k] = Math.round(
                  d[i + k] * (1 - amount) + fog[k] * amount,
                );
            }
          }
          if (layered && layer > 0) {
            // Keep scenery connected to the bottom, discarding panel-boundary specks.
            const seen = new Uint8Array(320 * 180),
              q = [];
            for (let x = 0; x < 320; x++)
              if (d[(179 * 320 + x) * 4 + 3]) {
                q.push(179 * 320 + x);
                seen[179 * 320 + x] = 1;
              }
            for (let n = 0; n < q.length; n++) {
              const at = q[n],
                x = at % 320;
              for (const to of [
                at - 320,
                at + 320,
                ...(x ? [at - 1] : []),
                ...(x < 319 ? [at + 1] : []),
              ])
                if (to >= 0 && to < seen.length && !seen[to] && d[to * 4 + 3]) {
                  seen[to] = 1;
                  q.push(to);
                }
            }
            for (let n = 0; n < seen.length; n++)
              if (!seen[n]) d[n * 4 + 3] = 0;
          }
          ctx.putImageData(data, 0, 0);
          canvases.push(c);
        }
        // A shared palette means compositing the three parallax planes stays <=32 colors.
        const histogram = new Map();
        for (const c of canvases) {
          const d = c.getContext("2d").getImageData(0, 0, 320, 180).data;
          for (let i = 0; i < d.length; i += 4)
            if (d[i + 3]) {
              const key =
                (d[i] >> 3) * 1024 + (d[i + 1] >> 3) * 32 + (d[i + 2] >> 3);
              let h = histogram.get(key);
              if (!h) {
                h = [0, 0, 0, 0];
                histogram.set(key, h);
              }
              for (let k = 0; k < 3; k++) h[k] += d[i + k];
              h[3]++;
            }
        }
        const points = [...histogram.values()].map((h) => [
          h[0] / h[3],
          h[1] / h[3],
          h[2] / h[3],
          h[3],
        ]);
        let boxes = [points];
        const range = (box) =>
          [0, 1, 2].map(
            (k) =>
              Math.max(...box.map((p) => p[k])) -
              Math.min(...box.map((p) => p[k])),
          );
        while (boxes.length < 32) {
          let chosen = -1,
            score = -1;
          for (let n = 0; n < boxes.length; n++)
            if (boxes[n].length > 1) {
              const s =
                Math.max(...range(boxes[n])) *
                Math.sqrt(boxes[n].reduce((a, p) => a + p[3], 0));
              if (s > score) {
                score = s;
                chosen = n;
              }
            }
          if (chosen < 0) break;
          const box = boxes.splice(chosen, 1)[0],
            ranges = range(box),
            axis = ranges.indexOf(Math.max(...ranges));
          box.sort((a, b) => a[axis] - b[axis]);
          const half = box.reduce((a, p) => a + p[3], 0) / 2;
          let split = 1,
            total = box[0][3];
          while (split < box.length - 1 && total < half)
            total += box[split++][3];
          boxes.push(box.slice(0, split), box.slice(split));
        }
        const palette = boxes.map((box) => {
          const total = box.reduce((a, p) => a + p[3], 0);
          return [0, 1, 2].map((k) =>
            Math.round(box.reduce((a, p) => a + p[k] * p[3], 0) / total),
          );
        });
        manifest.palettes[id] = palette;
        for (const c of canvases) {
          const ctx = c.getContext("2d"),
            data = ctx.getImageData(0, 0, 320, 180),
            d = data.data,
            cache = new Map();
          for (let i = 0; i < d.length; i += 4)
            if (d[i + 3]) {
              const key = d[i] * 65536 + d[i + 1] * 256 + d[i + 2];
              let color = cache.get(key);
              if (!color) {
                let best = Infinity;
                for (const p of palette) {
                  const dist =
                    (d[i] - p[0]) ** 2 +
                    (d[i + 1] - p[1]) ** 2 +
                    (d[i + 2] - p[2]) ** 2;
                  if (dist < best) {
                    best = dist;
                    color = p;
                  }
                }
                cache.set(key, color);
              }
              for (let k = 0; k < 3; k++) d[i + k] = color[k];
            }
          ctx.putImageData(data, 0, 0);
        }
        const [composite, ctx] = surface();
        for (const c of canvases) ctx.drawImage(c, 0, 0);
        frames.push({ group: "worlds", id, canvas: composite });
        if (layered)
          for (let n = 0; n < 3; n++)
            frames.push({
              group: "parallax",
              id: id + "-" + ["sky", "far", "near"][n],
              canvas: canvases[n],
            });
      }
      const atlas = document.createElement("canvas");
      atlas.width = 960;
      atlas.height = Math.ceil(frames.length / 3) * 180;
      const ctx = atlas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      frames.forEach((f, n) => {
        const x = (n % 3) * 320,
          y = Math.floor(n / 3) * 180;
        ctx.drawImage(f.canvas, x, y);
        manifest.groups[f.group][f.id] = [{ x, y, w: 320, h: 180 }];
      });
      return { manifest, png: atlas.toDataURL().split(",")[1] };
    }, sources);
    fs.writeFileSync(
      "public/art/generated-worlds/atlas-v1.png",
      Buffer.from(result.png, "base64"),
    );
    fs.writeFileSync(
      "public/art/generated-worlds/manifest.json",
      JSON.stringify(result.manifest, null, 2) + "\n",
    );
    console.log(
      "Prepared nine generated worlds and six separate parallax planes.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
