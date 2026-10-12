const { chromium } = require("playwright"),
  assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
  });
  const gameId = process.env.COOP_GAME || "meadow";
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
      hasTouch: true,
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.addInitScript(() => {
      window.testPads = [];
      Object.defineProperty(navigator, "getGamepads", {
        value: () => window.testPads,
      });
    });
    await page.goto(process.env.ARCADE_URL || "http://127.0.0.1:5174");
    await page.waitForFunction(
      () => window.arcade?.snapshot().characterArtwork.loaded,
    );
    await page.locator(`[data-game="${gameId}"]`).click();
    assert.equal(
      await page.locator("[data-level]").count(),
      gameId === "meadow" ? 6 : 0,
    );
    await page.locator("#coop-on").check();
    await page.locator('[data-helper="nur"]').click();
    await page.screenshot({
      path: `tests/artifacts/${gameId}-coop-intro.png`,
      fullPage: true,
    });
    await page.locator("#overlay-action").click();
    await page.waitForFunction(
      () => window.arcade.snapshot().buddy?.player.ground,
    );
    const before = await page.evaluate(() => window.arcade.snapshot());
    await page.keyboard.down("KeyD");
    await page.waitForFunction(
      (x) => window.arcade.snapshot().buddy.player.x > x + 25,
      before.buddy.player.x,
    );
    await page.keyboard.up("KeyD");
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).player.x,
      before.player.x,
      "helper keys do not move the lead",
    );
    await page.keyboard.down("Space");
    await page.keyboard.down("KeyF");
    await page.waitForFunction(() => {
      const s = window.arcade.snapshot();
      return s.player.vy < 0 && s.buddy.player.vy < 0;
    });
    await page.keyboard.up("Space");
    await page.keyboard.up("KeyF");
    await page.waitForFunction(
      () =>
        window.arcade.snapshot().player.ground &&
        window.arcade.snapshot().buddy.player.ground,
    );
    await page.screenshot({
      path: `tests/artifacts/${gameId}-family-coop.png`,
    });
    await page.evaluate(() => {
      window.testPads = [0, 1].map((index) => ({
        index,
        id: "Family pad " + index,
        connected: true,
        mapping: "standard",
        axes: [0, 0],
        buttons: Array.from({ length: 17 }, () => ({
          pressed: false,
          value: 0,
        })),
      }));
      window.testPads[0].axes[0] = 1;
      window.testPads[1].axes[0] = -1;
    });
    const padsBefore = await page.evaluate(() => window.arcade.snapshot());
    await page.waitForFunction((b) => {
      const s = window.arcade.snapshot();
      return (
        s.player.x > b.player.x + 15 && s.buddy.player.x < b.buddy.player.x - 15
      );
    }, padsBefore);
    await page.evaluate(() => (window.testPads = []));
    await page.waitForFunction(
      () => window.arcade.snapshot().mode === "paused",
    );
    await page.locator("#overlay-home").click();
    await page.setViewportSize({ width: 844, height: 390 });
    await page.locator(`[data-game="${gameId}"]`).click();
    await page.locator("#coop-touch").check();
    await page.screenshot({
      path: `tests/artifacts/${gameId}-coop-landscape-intro.png`,
      fullPage: true,
    });
    await page.locator("#overlay-action").click();
    await page.waitForFunction(() => window.arcade.snapshot().player.ground);
    await page.evaluate(() => {
      window.testPads = [
        {
          index: 0,
          id: "Parent pad",
          connected: true,
          mapping: "standard",
          axes: [1, 0],
          buttons: Array.from({ length: 17 }, () => ({
            pressed: false,
            value: 0,
          })),
        },
      ];
    });
    const touchBefore = await page.evaluate(() => window.arcade.snapshot());
    await page.waitForFunction(
      (x) => window.arcade.snapshot().buddy.player.x > x + 15,
      touchBefore.buddy.player.x,
    );
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).player.x,
      touchBefore.player.x,
      "single parent controller does not steer touch player",
    );
    const cdp = await page.context().newCDPSession(page),
      r = await page.locator(".dpad").boundingBox();
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        {
          id: 1,
          x: r.x + r.width * 0.84,
          y: r.y + r.height * 0.5,
          radiusX: 4,
          radiusY: 4,
          force: 1,
        },
      ],
    });
    await page.waitForFunction(
      (x) => window.arcade.snapshot().player.x > x + 15,
      touchBefore.player.x,
    );
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.evaluate(() => (window.testPads = []));
    await page.screenshot({
      path: `tests/artifacts/${gameId}-coop-touch.png`,
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      "PASS: independent keyboard heroes, simultaneous jumps, fixed two-controller roles, touch plus one parent controller, responsive co-op setup",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
