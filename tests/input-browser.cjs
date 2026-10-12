const { chromium } = require("playwright"),
  assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXECUTABLE,
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  // Desktop Chromium cannot resize an OS fullscreen window. Leave it through
  // the browser API, then test the responsive viewport fallback and resume.
  const resizeViewport = async (size) => {
    await page.evaluate(async () => {
      if (document.fullscreenElement) await document.exitFullscreen();
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
    });
    await page.setViewportSize(size);
    if (
      (await page.evaluate(() => window.arcade?.snapshot().mode)) === "paused"
    )
      await page.locator("#overlay-action").click();
  };
  try {
    await page.addInitScript(() => {
      window.testPads = [];
      Object.defineProperty(navigator, "getGamepads", {
        value: () => window.testPads,
      });
    });
    await page.goto(process.env.ARCADE_URL || "http://127.0.0.1:5174");
    await page.waitForFunction(
      () => window.arcade?.snapshot().objectArtwork.loaded,
    );
    await page.locator('[data-game="forest"]').click();
    await page.locator("#overlay-action").click();
    const session = await page.context().newCDPSession(page),
      r = await page.locator(".dpad").boundingBox();
    const point = (id, x, y) => ({
      id,
      x,
      y,
      radiusX: 4,
      radiusY: 4,
      force: 1,
    });
    const send = (type, points) =>
      session.send("Input.dispatchTouchEvent", { type, touchPoints: points });
    const right = point(1, r.x + r.width * 0.84, r.y + r.height * 0.5),
      diag = point(1, r.x + r.width * 0.84, r.y + r.height * 0.16),
      left = point(1, r.x + r.width * 0.16, r.y + r.height * 0.5);
    const initial = await page.evaluate(() => window.arcade.snapshot().player);
    await send("touchStart", [right]);
    await page.waitForFunction(
      (x) => window.arcade.snapshot().player.x > x + 18,
      initial.x,
    );
    const a = await page.evaluate(() => window.arcade.snapshot().player);
    await send("touchMove", [diag]);
    await page.waitForFunction(
      (y) => window.arcade.snapshot().player.y < y - 18,
      a.y,
    );
    const b = await page.evaluate(() => window.arcade.snapshot().player);
    assert.ok(b.x > a.x);
    await send("touchMove", [left]);
    await page.waitForFunction(
      (x) => window.arcade.snapshot().player.x < x - 15,
      b.x,
    );
    const action = await page.locator('[data-key="a"]').boundingBox();
    await send("touchStart", [
      left,
      point(2, action.x + action.width / 2, action.y + action.height / 2),
    ]);
    await page.waitForFunction(
      () => window.arcade.snapshot().animation.state === "action",
    );
    await send("touchCancel", []);
    await page.waitForTimeout(180);
    assert.equal(await page.locator(".held").count(), 0);
    const resting = await page.evaluate(() => window.arcade.snapshot().player);
    await page.waitForTimeout(120);
    assert.deepEqual(
      await page.evaluate(() => window.arcade.snapshot().player),
      resting,
    );
    await page.screenshot({ path: "tests/artifacts/thumb-controls.png" });
    await page.evaluate(() => {
      window.testPads = [0, 1].map((index) => ({
        index,
        id: "Controller " + index,
        connected: true,
        mapping: "standard",
        axes: [0, 0],
        buttons: Array.from({ length: 17 }, () => ({
          pressed: false,
          value: 0,
        })),
      }));
      window.testPads[1].axes[0] = 1;
    });
    const start = await page.evaluate(() => window.arcade.snapshot().player.x);
    await page.waitForFunction(
      (x) => window.arcade.snapshot().player.x > x + 15,
      start,
    );
    await page.evaluate(() => {
      window.testPads[0].axes[0] = -1;
      window.testPads[1].axes[0] = 0;
    });
    const turn = await page.evaluate(() => window.arcade.snapshot().player.x);
    await page.waitForFunction(
      (x) => window.arcade.snapshot().player.x < x - 15,
      turn,
    );
    await page.evaluate(() => {
      window.testPads = [];
    });
    await page.waitForTimeout(180);
    assert.equal(await page.locator(".held").count(), 0);
    await page.waitForFunction(
      () => window.arcade.snapshot().mode === "paused",
    );
    await page.locator("#overlay-action").click();
    // Landscape overlays let the thumb start in an empty diagonal pad corner.
    await resizeViewport({ width: 844, height: 390 });
    const landscape = await page.locator(".dpad").boundingBox();
    const beforeDiagonal = await page.evaluate(
      () => window.arcade.snapshot().player,
    );
    await send("touchStart", [
      point(
        3,
        landscape.x + landscape.width * 0.84,
        landscape.y + landscape.height * 0.16,
      ),
    ]);
    await page.waitForFunction((p) => {
      const now = window.arcade.snapshot().player;
      return now.x > p.x + 10 && now.y < p.y - 10;
    }, beforeDiagonal);
    await send("touchEnd", []);
    await page.screenshot({ path: "tests/artifacts/landscape-thumb.png" });
    // A controller must not resume the game behind the profile dialog.
    await resizeViewport({ width: 390, height: 844 });
    await page.keyboard.press("Escape");
    await page.locator("#overlay-home").click();
    await page.locator("#profile").click();
    await page.evaluate(() => {
      window.testPads = [
        {
          index: 0,
          id: "Modal test controller",
          connected: true,
          mapping: "standard",
          axes: [0, 0],
          buttons: Array.from({ length: 17 }, (_, n) => ({
            pressed: n === 9,
            value: n === 9 ? 1 : 0,
          })),
        },
      ];
    });
    await page.waitForTimeout(180);
    assert.equal(
      await page.locator("#profile-dialog").evaluate((d) => d.open),
      true,
    );
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).mode,
      "home",
    );
    await page.evaluate(() => {
      window.testPads = [];
    });
    await page.keyboard.press("Escape");
    await resizeViewport({ width: 320, height: 568 });
    await page.locator('[data-game="forest"]').click();
    await page.locator("#overlay-action").click();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "narrow controls fit",
    );
    await page.screenshot({
      path: "tests/artifacts/narrow-game.png",
      fullPage: true,
    });
    await page.locator("#back").click();
    await page.locator("#gentle").focus();
    const gentleBefore = await page.locator("#gentle").isChecked();
    await page.evaluate(() => {
      window.testPads = [
        {
          index: 0,
          id: "Menu controller",
          connected: true,
          mapping: "standard",
          axes: [0, 0],
          buttons: Array.from({ length: 17 }, (_, n) => ({
            pressed: n === 0,
            value: n === 0 ? 1 : 0,
          })),
        },
      ];
    });
    await page.waitForFunction(
      (before) => document.querySelector("#gentle").checked !== before,
      gentleBefore,
    );
    await page.evaluate(() => {
      window.testPads = [];
    });
    await page.keyboard.press("Space");
    assert.equal(await page.locator("#gentle").isChecked(), gentleBefore);
    console.log(
      "PASS: thumb slides, landscape diagonal start, simultaneous wand action, cancellation, automatic active-controller switching, modal pause guard, narrow controls",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
