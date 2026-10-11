const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXECUTABLE,
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
  });
  for (const dpr of [1, 1.25, 2]) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
      deviceScaleFactor: dpr,
    });
    await page.goto(process.env.ARCADE_URL || "http://127.0.0.1:5174");
    const errors = await page.evaluate(async () => {
      const harness = await import("/tests/browser-harness.js");
      const { Painter } = harness.engine,
        { createGame } = harness.games;
      const { background, WORLD_ORDER } = harness.worlds;
      await harness.loadArt();
      const fingerprints = new Set();
      for (const id of WORLD_ORDER) {
        const c = background(id);
        if (c.width !== 320 || c.height !== 180)
          throw new Error(id + " background dimensions");
        const d = c.getContext("2d").getImageData(0, 0, 320, 180).data,
          colors = new Set();
        for (let i = 0; i < d.length; i += 4) {
          colors.add(`${d[i]},${d[i + 1]},${d[i + 2]}`);
          if (d[i + 3] !== 255) throw new Error(id + " alpha");
        }
        if (colors.size > 32)
          throw new Error(id + " palette exceeds 32 colors");
        fingerprints.add([...colors].sort().join(";"));
      }
      if (fingerprints.size !== 8)
        throw new Error("World palettes are not distinct");
      const parent = document.createElement("div");
      Object.assign(parent.style, {
        position: "absolute",
        width: "963px",
        height: "547px",
        left: "0",
        top: "0",
      });
      const canvas = document.createElement("canvas");
      parent.append(canvas);
      document.body.append(parent);
      const p = new Painter(canvas),
        errors = [];
      const integer = (n) => Math.abs(n - Math.round(n)) < 1e-6;
      for (const id of [
        "summit",
        "meadow",
        "forest",
        "rally",
        "bricks",
        "garden",
        "space",
      ]) {
        const g = createGame(id, true);
        for (let k = 0; k < 15; k++) {
          g.update(1 / 60, { x: 1, y: 1, current: {}, pressed: {} });
          g.draw(p);
          p.finish();
          if (!p.textures.has(id === "rally" ? "rally:mode7" : "world:" + id))
            throw new Error(id + " missing rendered background");
          for (const m of p.pool.filter((m) => m.visible)) {
            const w = Math.abs(m.scale.x) / 3,
              h = m.scale.y / 3;
            if (
              !integer(w) ||
              !integer(h) ||
              !integer(m.position.x / 3 - w / 2) ||
              !integer(m.position.y / 3 - h / 2) ||
              m.rotation.z !== 0
            )
              errors.push(id + ": fractional geometry");
            const img = m.material.map?.image;
            if (img && (img.width !== w || img.height !== h))
              errors.push(id + ": scaled texel");
          }
        }
      }
      p.dispose();
      parent.remove();
      return [...new Set(errors)];
    });
    assert.deepEqual(errors, []);
    await page.waitForFunction(
      () => window.arcade?.snapshot().characterArtwork.loaded,
    );
    for (const viewport of [
      { width: 1440, height: 1100 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(150);
      const raster = await page.evaluate(async () => {
        const imgs = [...document.querySelectorAll(".pixel-cover")];
        await Promise.all(imgs.map((img) => img.decode()));
        return imgs.map((img) => {
          const r = img.getBoundingClientRect(),
            d = devicePixelRatio,
            style = getComputedStyle(img);
          return {
            kind: img.className,
            sx: (r.width * d) / img.naturalWidth,
            sy: (r.height * d) / img.naturalHeight,
            x: r.x * d,
            y: r.y * d,
            fit: style.objectFit,
            filter: style.imageRendering,
          };
        });
      });
      assert.equal(raster.length, 7);
      for (const img of raster) {
        assert.equal(
          img.fit,
          "fill",
          img.kind + " content follows its integer-sized box",
        );
        assert.equal(img.filter, "pixelated");
        for (const k of ["sx", "sy", "x", "y"])
          assert.ok(
            Math.abs(img[k] - Math.round(img[k])) < 0.035,
            `${dpr} ${img.kind} ${k}: ${img[k]}`,
          );
        assert.ok(Math.abs(img.sx - img.sy) < 0.001);
      }
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.locator('[data-game="summit"]').click();
    await page.locator("#overlay-action").click();
    for (const viewport of [
      { width: 1440, height: 1100 },
      { width: 390, height: 844 },
      { width: 320, height: 568 },
      { width: 844, height: 390 },
      { width: 568, height: 320 },
    ]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(150);
      await page.waitForFunction(
        () => {
          const c = document.querySelector("#game-canvas"),
            r = c.getBoundingClientRect();
          return (
            r.width <= c.parentElement.clientWidth + 0.1 &&
            r.height <= c.parentElement.clientHeight + 0.1
          );
        },
        null,
        { timeout: 5000 },
      );
      const display = await page.locator("#game-canvas").evaluate((c) => {
        const r = c.getBoundingClientRect(),
          d = devicePixelRatio;
        return {
          rect: {
            x: r.x,
            y: r.y,
            w: r.width,
            h: r.height,
            parentW: c.parentElement.clientWidth,
            parentH: c.parentElement.clientHeight,
            viewport: innerWidth,
            cssWidth: c.style.width,
          },
          width: c.width,
          height: c.height,
          sx: (r.width * d) / 320,
          sy: (r.height * d) / 180,
          x: r.left * d,
          y: r.top * d,
          fits:
            r.left >= -0.1 &&
            r.right <= innerWidth + 0.1 &&
            r.width <= c.parentElement.clientWidth + 0.1 &&
            r.height <= c.parentElement.clientHeight + 0.1,
        };
      });
      assert.equal(display.width, 320);
      assert.equal(display.height, 180);
      assert.ok(
        display.fits,
        `${dpr}: entire native framebuffer fits ${viewport.width}x${viewport.height}: ${JSON.stringify(display)}`,
      );
      for (const k of ["sx", "sy", "x", "y"])
        assert.ok(
          Math.abs(display[k] - Math.round(display[k])) < 0.03,
          `${dpr} ${k}: ${display[k]}`,
        );
      assert.ok(Math.abs(display.sx - display.sy) < 0.001);
    }
    await page.close();
  }
  await browser.close();
  console.log(
    "PASS: all seven games use 1:1 texels and integer edges; integer display scaling at DPR 1, 1.25 and 2 across desktop, portrait and landscape",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
