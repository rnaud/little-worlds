const { chromium } = require("playwright"),
  assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.addInitScript(() => {
      window.pad = {
        index: 0,
        id: "Shelf controller",
        connected: true,
        mapping: "standard",
        axes: [0, 0],
        buttons: Array.from({ length: 17 }, () => ({
          pressed: false,
          value: 0,
        })),
      };
      Object.defineProperty(navigator, "getGamepads", {
        value: () => [window.pad],
      });
    });
    await page.goto(process.env.ARCADE_URL || "http://127.0.0.1:5174");
    await page.waitForFunction(
      () => window.arcade?.snapshot().characterArtwork.loaded,
    );
    const press = async (n) => {
      await page.evaluate(
        (n) => (window.pad.buttons[n] = { pressed: true, value: 1 }),
        n,
      );
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      await page.evaluate(
        (n) => (window.pad.buttons[n] = { pressed: false, value: 0 }),
        n,
      );
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
    };
    const focused = () =>
      page.evaluate(
        () =>
          document.activeElement.dataset.game ||
          document.activeElement.id ||
          document.activeElement.dataset.character ||
          document.activeElement.dataset.letter,
      );
    assert.equal(await focused(), "summit");
    await press(14);
    assert.equal(
      await focused(),
      "summit",
      "left edge stays on the cartridge row",
    );
    await press(15);
    assert.equal(await focused(), "meadow");
    await press(13);
    assert.equal(await focused(), "garden");
    await press(12);
    assert.equal(await focused(), "meadow");
    await page.screenshot({
      path: "tests/artifacts/cartridge-shelf.png",
      fullPage: true,
    });
    await press(0);
    await page.waitForFunction(() => window.arcade.snapshot().mode === "intro");
    assert.equal(await focused(), "overlay-action");
    await press(13);
    assert.equal(
      await page.evaluate(() => document.activeElement.dataset.level),
      "0",
    );
    await press(15);
    assert.equal(
      await page.evaluate(() => document.activeElement.dataset.level),
      "1",
    );
    await press(0);
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).level,
      1,
    );
    await press(0);
    await page.waitForFunction(
      () => window.arcade.snapshot().mode === "playing",
    );
    await press(9);
    await page.waitForFunction(
      () => window.arcade.snapshot().mode === "paused",
    );
    await press(13);
    assert.equal(await focused(), "overlay-assist");
    await press(0);
    await press(13);
    assert.equal(await focused(), "overlay-sound");
    await press(0);
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).audio.enabled,
      false,
    );
    await press(13);
    assert.equal(await focused(), "overlay-restart");
    await press(0);
    await page.waitForFunction(() => window.arcade.snapshot().mode === "intro");
    await press(1);
    await page.waitForFunction(() => window.arcade.snapshot().mode === "home");
    assert.equal(await focused(), "meadow");
    // Walk to the toolbar using only the directional pad.
    await press(13);
    await press(13);
    assert.equal(await focused(), "players");
    await press(0);
    assert.equal(await focused(), "gaia");
    await press(15);
    assert.equal(await focused(), "bean");
    await press(0);
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).character,
      "bean",
    );
    await press(1);
    assert.equal(await focused(), "players");
    await press(15);
    assert.equal(await focused(), "album-open");
    await press(0);
    assert.equal(
      await page.locator("#album-dialog").evaluate((d) => d.open),
      true,
    );
    await press(1);
    assert.equal(await focused(), "album-open");
    await press(1);
    await press(12);
    await press(15);
    assert.equal(await focused(), "sound");
    await press(15);
    assert.equal(await focused(), "profile");
    await press(0);
    assert.equal(await focused(), "A");
    await press(15);
    await press(0);
    for (let n = 0; n < 4; n++) await press(13);
    await press(0);
    assert.equal(
      await page.locator("#profile-dialog").evaluate((d) => d.open),
      false,
    );
    assert.equal(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("little-worlds-v1")).name,
      ),
      "BeanB",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await press(1);
    assert.equal(await focused(), "summit");
    await press(13);
    assert.equal(await focused(), "forest");
    await press(13);
    assert.equal(await focused(), "bricks");
    await press(13);
    assert.equal(await focused(), "space");
    const box = await page.locator('[data-game="space"]').boundingBox();
    assert.ok(
      box.y >= 0 && box.y + box.height <= 844,
      "focused cartridge scrolls fully into view",
    );
    await page.screenshot({
      path: "tests/artifacts/cartridge-mobile.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const [index, id] of [
      "summit",
      "meadow",
      "forest",
      "rally",
      "bricks",
      "garden",
      "space",
    ].entries()) {
      await press(1);
      if (index >= 4) await press(13);
      for (let column = 0; column < index % 4; column++) await press(15);
      assert.equal(await focused(), id);
      await press(0);
      await press(0);
      await page.waitForFunction(
        () => window.arcade.snapshot().mode === "playing",
      );
      if (id === "garden") {
        await press(13);
        await page.waitForTimeout(200);
        await press(13);
        await page.waitForFunction(
          () => window.arcade.snapshot().mode === "won",
        );
        await press(0);
        await page.waitForFunction(
          () =>
            window.arcade.snapshot().mode === "playing" &&
            window.arcade.snapshot().level === 1,
        );
      }
      await press(9);
      await page.waitForFunction(
        () => window.arcade.snapshot().mode === "paused",
      );
      await press(1);
      await page.waitForFunction(
        () => window.arcade.snapshot().mode === "home",
      );
      assert.equal(await focused(), id);
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS controller-only shelf, spatial grid, stage selection, launch, pause, assist, restart, back, family, album, on-screen name keyboard, mobile scroll, seven cartridges and next-stage victory",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
