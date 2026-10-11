const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXECUTABLE,
    args: ["--use-gl=angle", "--use-angle=swiftshader"],
  });
  try {
    for (const config of [
      { viewport: { width: 1440, height: 900 } },
      {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
      {
        viewport: { width: 844, height: 390 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    ]) {
      const page = await browser.newPage(config);
      await page.goto(process.env.ARCADE_URL || "http://127.0.0.1:5174");
      await page.locator('[data-game="meadow"]').click();
      await page.locator("#overlay-action").click();
      await page.waitForFunction(
        () => window.arcade.snapshot().mode === "playing",
      );
      const layout = await page.evaluate(() => {
        const box = (el) => {
          const r = document.querySelector(el).getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height, bottom: r.bottom };
        };
        return {
          player: box("#play"),
          canvas: box("#game-canvas"),
          width: innerWidth,
          height: innerHeight,
          scroll: scrollY,
        };
      });
      assert.equal(layout.player.w, layout.width);
      assert.equal(layout.player.h, layout.height);
      assert.equal(layout.scroll, 0);
      assert.ok(layout.canvas.y >= 0 && layout.canvas.bottom <= layout.height);
      await page.screenshot({
        path: `tests/artifacts/fullscreen-${config.viewport.width}.png`,
      });
      await page.keyboard.press("Escape");
      await page.waitForFunction(
        () => window.arcade.snapshot().mode === "paused",
      );
      await page.locator("#overlay-home").click();
      await page.waitForFunction(
        () =>
          window.arcade.snapshot().mode === "home" &&
          !document.fullscreenElement,
      );
      assert.ok(await page.locator('[data-game="meadow"]').isVisible());
      await page.close();
    }
    console.log(
      "Fullscreen viewport, pause menu and exit passed on desktop and both phone orientations.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
