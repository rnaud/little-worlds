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
      deviceScaleFactor: 1.25,
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(process.env.ARCADE_URL || "http://127.0.0.1:5174");
    await page.waitForFunction(
      () => window.arcade?.snapshot().objectArtwork.loaded,
    );
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).characterArtwork
        .prepared,
      true,
    );
    await page.locator('[data-game="garden"]').click();
    await page.locator("#overlay-action").click();
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(250);
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(() => window.arcade.snapshot().mode === "won");
    assert.equal(await page.locator("#victory-party").isVisible(), true);
    const before = await page.evaluate(() => ({
      pixels: document.querySelector("#victory-party").toDataURL(),
      time: window.arcade.snapshot().time,
    }));
    await page.waitForTimeout(340);
    const after = await page.evaluate(() => ({
      pixels: document.querySelector("#victory-party").toDataURL(),
      time: window.arcade.snapshot().time,
    }));
    assert.notEqual(
      before.pixels,
      after.pixels,
      "family celebrates with changing sprite poses",
    );
    assert.equal(before.time, after.time, "victory keeps simulation frozen");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(60);
    const still = await page
      .locator("#victory-party")
      .evaluate((c) => c.toDataURL());
    await page.waitForTimeout(350);
    assert.equal(
      await page.locator("#victory-party").evaluate((c) => c.toDataURL()),
      still,
      "reduced-motion celebration is still",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.screenshot({ path: "tests/artifacts/victory-family.png" });
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport);
      await page.locator("#overlay-home").scrollIntoViewIfNeeded();
      const bounds = await page.locator("#overlay-home").boundingBox();
      assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= viewport.height);
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      const pixels = await page.locator("#victory-party").evaluate((c) => {
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
          Math.abs(n - Math.round(n)) < 0.035,
          `victory pixels remain physically aligned: ${JSON.stringify(pixels)}`,
        );
      await page.screenshot({
        path: `tests/artifacts/victory-${viewport.width}.png`,
      });
    }
    await page.locator("#overlay-action").click();
    await page.waitForFunction(
      () => window.arcade.snapshot().mode === "playing",
    );
    assert.equal(await page.locator("#victory-party").isVisible(), false);
    const record = (await page.evaluate(() => window.arcade.snapshot()))
      .records["garden:0:gentle:solo"];
    assert.equal(record.finishes, 1);
    assert.equal(record.bestMoves, 2);
    await page.reload();
    await page.waitForFunction(() => window.arcade?.snapshot());
    assert.deepEqual(
      (await page.evaluate(() => window.arcade.snapshot())).records[
        "garden:0:gentle:solo"
      ],
      record,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: complete garden puzzle, animated family victory, frozen physics, portrait/landscape victory actions, replay",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
