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
    const reports = [];
    for (const id of ["rally", "bricks", "space"]) {
      await page.locator(`[data-game="${id}"]`).click();
      await page.locator("#overlay-action").click();
      await page.evaluate((id) => {
        const held = new Set(),
          started = performance.now(),
          canvas = document.querySelector("#game-canvas");
        window.arcadeDriver = null;
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
            f = s.playfield,
            next = new Set();
          if (s.mode === "won" || performance.now() - started > 150000) {
            set(next);
            window.arcadeDriver = {
              id,
              won: s.mode === "won",
              time: s.time,
              score: s.score,
              message: s.message,
            };
            return;
          }
          let dx = 0,
            dy = 0;
          if (id === "rally")
            dx = 480 + Math.sin(f.distance / 360 + 424 / 220) * 85 - s.player.x;
          if (id === "space") {
            dy = (f.targets[0]?.y || s.player.y) - s.player.y;
            next.add("Space");
          }
          if (id === "bricks") {
            const target = [...f.targets].sort(
              (a, b) => Math.abs(a.x - f.ball.x) - Math.abs(b.x - f.ball.x),
            )[0];
            const offset = target
              ? Math.max(
                  -f.paddle.w * 0.32,
                  Math.min(f.paddle.w * 0.32, (target.x - f.ball.x) * -0.15),
                )
              : 0;
            dx = f.ball.x + offset - f.paddle.x;
            if (!f.launched) next.add("Space");
          }
          if (Math.abs(dx) > 4) next.add(dx > 0 ? "ArrowRight" : "ArrowLeft");
          if (Math.abs(dy) > 4) next.add(dy > 0 ? "ArrowDown" : "ArrowUp");
          set(next);
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }, id);
      await page.waitForFunction(() => window.arcade.snapshot().time > 4);
      await page.screenshot({ path: `tests/artifacts/${id}-in-play.png` });
      await page.waitForFunction(() => window.arcadeDriver, null, {
        timeout: 160000,
      });
      const report = await page.evaluate(() => window.arcadeDriver);
      assert.ok(report.won, JSON.stringify(report));
      reports.push(report);
      await page.screenshot({ path: `tests/artifacts/${id}-complete.png` });
      await page.locator("#overlay-home").click();
    }
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        result: "PASS",
        checks: [
          "rally finish through steering",
          "all 24 bricks through paddle aiming",
          "three space waves through flight and firing",
          "normal keyboard events only",
          "victory and replay navigation",
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
