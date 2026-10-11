const engines = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const names = (process.env.BROWSER_ENGINES || "webkit,firefox").split(","),
    reports = [];
  for (const name of names) {
    const browser = await engines[name].launch({
      headless: true,
      executablePath: process.env.BROWSER_EXECUTABLE || undefined,
    });
    try {
      const page = await browser.newPage({
          viewport: { width: 390, height: 844 },
          deviceScaleFactor: 2,
          hasTouch: name === "webkit",
        }),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(process.env.ARCADE_URL || "http://127.0.0.1:5174");
      await page.waitForFunction(
        () => window.arcade?.snapshot().characterArtwork.loaded,
      );
      const art = await page.evaluate(() => window.arcade.snapshot());
      for (const key of [
        "artwork",
        "characterArtwork",
        "creatureArtwork",
        "objectArtwork",
      ])
        assert.equal(
          art[key].prepared,
          true,
          `${name} ${key} uses native atlas`,
        );
      for (const id of [
        "summit",
        "meadow",
        "forest",
        "rally",
        "bricks",
        "garden",
        "space",
      ]) {
        await page.locator(`[data-game="${id}"]`).click();
        await page.locator("#overlay-action").click();
        await page.waitForFunction(() => window.arcade.snapshot().time > 0.2);
        const snapshot = await page.evaluate(() => window.arcade.snapshot());
        assert.equal(snapshot.mode, "playing");
        assert.ok(
          snapshot.renderer.calls > 0,
          `${name} ${id} WebGL draw calls`,
        );
        if (id === "forest") {
          const x = snapshot.player.x;
          await page.keyboard.down("ArrowRight");
          await page.waitForFunction(
            (x) => window.arcade.snapshot().player.x > x + 15,
            x,
          );
          await page.keyboard.up("ArrowRight");
          await page.screenshot({
            path: `tests/artifacts/${name}-forest.png`,
            fullPage: true,
          });
        }
        await page.keyboard.press("Escape");
        await page.waitForFunction(
          () => window.arcade.snapshot().mode === "paused",
        );
        await page.locator("#overlay-home").click();
      }
      await page.goto(
        (process.env.ARCADE_URL || "http://127.0.0.1:5174") +
          "/sprite-lab.html",
      );
      await page.waitForFunction(() => window.spriteStudio?.status.loaded);
      await page.selectOption("#clip", "wall");
      const before = await page
        .locator("#actor-gaia")
        .evaluate((c) => c.toDataURL());
      await page.waitForTimeout(310);
      const after = await page
        .locator("#actor-gaia")
        .evaluate((c) => c.toDataURL());
      assert.notEqual(before, after, `${name} wall animation changes`);
      const pixels = await page.locator("#actor-gaia").evaluate((c) => {
        const r = c.getBoundingClientRect(),
          d = devicePixelRatio;
        return [
          r.x * d,
          r.y * d,
          (r.width * d) / c.width,
          (r.height * d) / c.height,
        ];
      });
      for (const n of pixels)
        assert.ok(
          Math.abs(n - Math.round(n)) < 0.04,
          `${name} integer artwork pixels`,
        );
      assert.deepEqual(errors, []);
      reports.push({
        engine: name,
        games: 7,
        art: "native",
        keyboard: "passed",
        animation: "passed",
      });
    } finally {
      await browser.close();
    }
  }
  console.log(JSON.stringify({ result: "PASS", reports }));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
