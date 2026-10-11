const { chromium } = require("playwright"),
  assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
  });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
    }),
    errors = [],
    reports = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(process.env.ARCADE_URL || "http://127.0.0.1:5174");
    await page.waitForFunction(
      () => window.arcade?.snapshot().characterArtwork.loaded,
    );
    await page.locator("#gentle").uncheck();
    await page.locator('[data-game="meadow"]').click();
    await page.locator("#overlay-action").click();
    for (let level = 0; level < 6; level++) {
      const result = await page.evaluate(async (level) => {
        const { meadowDriver } = await import("/tests/meadow-driver.js"),
          driver = meadowDriver(level);
        return new Promise((resolve, reject) => {
          const held = new Set(),
            canvas = document.querySelector("#game-canvas"),
            started = performance.now();
          const set = (next) => {
            for (const code of held)
              if (!next.has(code)) {
                canvas.dispatchEvent(
                  new KeyboardEvent("keyup", { code, bubbles: true }),
                );
                held.delete(code);
              }
            for (const code of next)
              if (!held.has(code)) {
                canvas.dispatchEvent(
                  new KeyboardEvent("keydown", { code, bubbles: true }),
                );
                held.add(code);
              }
          };
          const frame = () => {
            const s = window.arcade.snapshot();
            if (s.mode === "won") {
              set(new Set());
              resolve({
                level,
                time: s.time,
                score: s.score,
                message: s.message,
              });
              return;
            }
            if (performance.now() - started > 40000) {
              set(new Set());
              reject(
                new Error(
                  `Stage ${level} stalled at ${driver.waypoint}: ${JSON.stringify(s.player)}`,
                ),
              );
              return;
            }
            const i = driver.input(s),
              keys = new Set(i.current.b ? ["ShiftLeft"] : []);
            if (i.x) keys.add(i.x > 0 ? "ArrowRight" : "ArrowLeft");
            if (i.current.a) keys.add("Space");
            set(keys);
            requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        });
      }, level);
      assert.match(result.message, /0 retries/);
      reports.push(result);
      await page.screenshot({
        path: `tests/artifacts/meadow-stage-${level + 1}.png`,
      });
      if (level < 5) await page.locator("#overlay-action").click();
    }
    assert.equal(
      Object.keys(
        (await page.evaluate(() => window.arcade.snapshot())).levelRecords
          .meadow,
      ).length,
      6,
    );
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ result: "PASS", reports }));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
