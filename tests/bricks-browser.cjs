const { chromium } = require("playwright"),
  assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
  });
  try {
    const page = await browser.newPage({
        viewport: { width: 1280, height: 900 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.ARCADE_URL || "http://127.0.0.1:5174");
    await page.locator("#gentle").uncheck();
    await page.locator('[data-game="bricks"]').click();
    assert.equal(await page.locator("[data-level]").count(), 3);
    await page.locator("#overlay-action").click();
    const reports = [];
    for (let level = 0; level < 3; level++) {
      const report = await page.evaluate(
        () =>
          new Promise((resolve, reject) => {
            const held = new Set(),
              canvas = document.querySelector("#game-canvas"),
              started = performance.now();
            let caught = false,
              attemptAt = 0;
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
                f = s.playfield;
              if (s.notice.startsWith("Caught")) caught = true;
              if (s.mode === "won") {
                set(new Set());
                resolve({
                  level: s.level,
                  time: s.time,
                  score: s.score,
                  caught,
                  notice: s.notice,
                });
                return;
              }
              if (s.mode === "lost" || performance.now() - started > 120000) {
                set(new Set());
                reject(
                  new Error(
                    JSON.stringify({
                      mode: s.mode,
                      time: s.time,
                      score: s.score,
                    }),
                  ),
                );
                return;
              }
              const next = new Set(),
                target = [...f.targets].sort(
                  (a, b) => Math.abs(a.x - f.ball.x) - Math.abs(b.x - f.ball.x),
                )[0];
              const offset = target
                ? Math.max(
                    -f.paddle.w * 0.32,
                    Math.min(f.paddle.w * 0.32, (target.x - f.ball.x) * -0.15),
                  )
                : 0;
              const dx = f.ball.x + offset - f.paddle.x;
              if (Math.abs(dx) > 4)
                next.add(dx > 0 ? "ArrowRight" : "ArrowLeft");
              if (!f.launched && !held.has("Space")) next.add("Space");
              else if (
                !caught &&
                f.ball.vy > 0 &&
                f.ball.y > 400 &&
                s.time - attemptAt > 2.3
              ) {
                next.add("Space");
                attemptAt = s.time;
              }
              set(next);
              requestAnimationFrame(frame);
            };
            requestAnimationFrame(frame);
          }),
      );
      assert.equal(report.score, 24);
      assert.equal(report.caught, true);
      reports.push(report);
      assert.ok(
        await page
          .locator("#overlay-results")
          .innerText()
          .then((s) => s.includes("Longest flight")),
      );
      await page.screenshot({
        path: `tests/artifacts/bricks-board-${level + 1}.png`,
      });
      if (level < 2) await page.locator("#overlay-action").click();
    }
    const progress = await page.evaluate(
      () => window.arcade.snapshot().levelRecords.bricks,
    );
    assert.equal(Object.keys(progress).length, 3);
    await page.reload();
    assert.equal(
      Object.keys(
        await page.evaluate(() => window.arcade.snapshot().levelRecords.bricks),
      ).length,
      3,
    );
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        result: "PASS",
        checks: [
          "three Classic brick boards",
          "timed catch and relaunch",
          "next-stage flow",
          "saved stage and flight records",
        ],
        reports,
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
