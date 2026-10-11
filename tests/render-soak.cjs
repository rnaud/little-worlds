const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXECUTABLE,
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
  });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(
      (process.env.ARCADE_URL || "http://127.0.0.1:5174") + "/sprite-lab.html",
    );
    await page.waitForFunction(() => window.spriteStudio?.status.loaded);
    const result = await page.evaluate(async () => {
      const harness = await import("/tests/browser-harness.js");
      const { Painter } = harness.engine,
        { createGame } = harness.games;
      await harness.loadArt();
      const stage = document.createElement("div");
      stage.style.cssText =
        "position:fixed;left:0;top:0;width:960px;height:540px";
      const canvas = document.createElement("canvas");
      stage.append(canvas);
      document.body.append(stage);
      const p = new Painter(canvas),
        reports = [],
        captures = [];
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
      for (let pass = 0; pass < 3; pass++) {
        for (const hero of ["gaia", "bean", "nur", "arnaud"])
          for (const id of ids) {
            p.hero = hero;
            const g = createGame(id, true);
            g.hero = hero;
            for (let k = 0; k < 360; k++) {
              const segment = Math.floor(k / 90),
                x = [1, 0, -1, 0][segment],
                y = ["forest", "space"].includes(id)
                  ? [0, -1, 0, 1][segment]
                  : 0;
              g.update(1 / 120, {
                x,
                y,
                current: { a: k % 60 < 30 },
                pressed: k % 90 === 0 ? { a: true, b: true } : {},
                released: {},
              });
              if (k % 30 === 0) {
                g.draw(p);
                p.finish();
              }
            }
            g.draw(p);
            p.finish();
            if (!p.textures.has(id === "rally" ? "rally:mode7" : "world:" + id))
              throw new Error(id + " background absent from renderer");
            if (pass === 0)
              captures.push({ id, hero, image: canvas.toDataURL() });
          }
        reports.push({
          pass: pass + 1,
          textures: p.textures.size,
          pool: p.pool.length,
          gpuTextures: p.renderer.info.memory.textures,
          geometries: p.renderer.info.memory.geometries,
        });
      }
      p.dispose();
      stage.remove();
      document.body.innerHTML =
        '<h1>Four family heroes · nine worlds</h1><p>Native scene captures after simulated gameplay. Each picture uses the actual Three.js renderer.</p><main id="contact"></main>';
      const contact = document.querySelector("#contact");
      contact.style.cssText =
        "display:grid;grid-template-columns:repeat(4,320px);gap:12px";
      for (const id of ids)
        for (const c of captures.filter((c) => c.id === id)) {
          const figure = document.createElement("figure");
          figure.style.cssText = "margin:0;background:#25283c;padding:0";
          const img = document.createElement("img");
          img.src = c.image;
          img.width = 320;
          img.height = 180;
          img.style.imageRendering = "pixelated";
          const caption = document.createElement("figcaption");
          caption.textContent = `${c.hero} · ${id}`;
          figure.append(img, caption);
          contact.append(figure);
        }
      return reports;
    });
    assert.equal(
      result[2].textures,
      result[1].textures,
      "texture cache stabilizes after revisiting all worlds",
    );
    assert.equal(result[2].pool, result[1].pool, "mesh pool stabilizes");
    assert.ok(result[2].textures < 1500, "bounded texture cache");
    assert.ok(result[2].pool < 1200, "bounded mesh pool");
    assert.deepEqual(errors, []);
    await page.screenshot({
      path: "tests/artifacts/family-worlds.png",
      fullPage: true,
    });
    console.log(
      JSON.stringify({
        result: "PASS",
        checks: [
          "four heroes in all nine worlds",
          "three repeated tours",
          "stable texture and mesh caches",
        ],
        reports: result,
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
