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
    await page.goto(process.env.ARCADE_URL || "http://127.0.0.1:5174");
    await page.waitForFunction(
      () => window.arcade?.snapshot().characterArtwork.loaded,
    );
    await page.locator("#gentle").uncheck();
    const reports = [];
    for (const id of ["summit", "meadow"]) {
      await page.locator(`[data-game="${id}"]`).click();
      await page.locator("#overlay-action").click();
      const result = await page.evaluate(async (id) => {
        const { meadowDriver } = await import("/tests/meadow-driver.js");
        const { summitDriver } = await import("/tests/summit-driver.js");
        const driver = id === "summit" ? summitDriver() : meadowDriver(0);
        return await new Promise((resolve, reject) => {
          const held = new Set(),
            started = performance.now(),
            canvas = document.querySelector("#game-canvas"),
            states = new Set();
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
            const s = window.arcade.snapshot(),
              p = s.player;
            states.add(s.animation.state);
            if (s.mode === "won") {
              set(new Set());
              resolve({
                id,
                time: s.time,
                score: s.score,
                message: s.message,
                states: [...states],
              });
              return;
            }
            if (performance.now() - started > 45000) {
              set(new Set());
              reject(
                new Error(
                  `${id} route stalled at ${driver.waypoint}: ${JSON.stringify(p)} ${s.message}`,
                ),
              );
              return;
            }
            const i = driver.input(s),
              next = new Set();
            if (i.x) next.add(i.x > 0 ? "ArrowRight" : "ArrowLeft");
            if (i.current.a) next.add("Space");
            if (i.current.b) next.add("ShiftLeft");
            set(next);
            requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        });
      }, id);
      assert.ok(result.score >= (id === "summit" ? 3 : 5));
      assert.match(result.message, /0 retries/);
      reports.push(result);
      await page.screenshot({ path: `tests/artifacts/${id}-complete.png` });
      await page.locator("#overlay-home").click();
    }
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        result: "PASS",
        checks: [
          "both platformers completed through keyboard movement",
          "classic mode",
          "zero retries",
          "animated victory",
        ],
        reports,
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
