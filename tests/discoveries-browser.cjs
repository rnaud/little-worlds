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
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(process.env.ARCADE_URL || "http://127.0.0.1:5174");
    await page.waitForFunction(
      () => window.arcade?.snapshot().characterArtwork.loaded,
    );
    await page.locator('[data-game="forest"]').click();
    await page.locator("#overlay-action").click();
    await page.evaluate(() => {
      window.walkTo = (x, y) =>
        new Promise((resolve, reject) => {
          const held = new Set(),
            started = performance.now(),
            canvas = document.querySelector("#game-canvas");
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
          const step = () => {
            const s = window.arcade.snapshot(),
              p = s.player,
              dx = x - p.x,
              dy = y - p.y;
            if (s.mode === "won" || Math.hypot(dx, dy) < 5) {
              set(new Set());
              resolve(s);
              return;
            }
            if (performance.now() - started > 12000) {
              set(new Set());
              reject(new Error(`Blocked walking to ${x},${y}: ${p.x},${p.y}`));
              return;
            }
            const next = new Set();
            if (Math.abs(dx) > 3) next.add(dx > 0 ? "ArrowRight" : "ArrowLeft");
            if (Math.abs(dy) > 3) next.add(dy > 0 ? "ArrowDown" : "ArrowUp");
            if (Math.floor(s.time * 4) % 2 === 0) next.add("Space");
            set(next);
            requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
    });

    const walk = async (x, y) =>
      page.evaluate(([x, y]) => window.walkTo(x, y), [x, y]);
    const discover = async (id) => {
      await page.keyboard.press("Space");
      await page.waitForFunction(
        (id) =>
          window.arcade.snapshot().discoveries.find((s) => s.id === id)?.found,
        id,
        { timeout: 10000 },
      );
    };
    await walk(115, 130);
    await walk(185, 175);
    await discover("ribbon");
    await page.screenshot({
      path: "tests/artifacts/bean-ribbon-discovery.png",
    });
    await walk(185, 307);
    await walk(365, 405);
    await discover("compass");
    await walk(404, 307);
    await walk(550, 307);
    await page.waitForFunction(() => window.arcade.snapshot().shortcut);
    await walk(550, 435);
    await walk(690, 435);
    await discover("seeds");
    await page.screenshot({ path: "tests/artifacts/bean-seed-discovery.png" });
    await walk(550, 307);
    await walk(550, 168);
    await walk(404, 168);
    assert.ok(
      (await page.evaluate(() => window.arcade.snapshot())).player.x < 450,
      "discovery shortcut can actually be traversed",
    );
    await page.locator("#back").click();
    await page.reload();
    await page.waitForFunction(
      () => window.arcade?.snapshot().characterArtwork.loaded,
    );
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).keepsakes.length,
      3,
    );
    await page.locator("#album-open").click();
    assert.equal(await page.locator(".keepsake-card.found").count(), 3);
    await page.screenshot({ path: "tests/artifacts/keepsake-album.png" });
    assert.deepEqual(errors, []);
    console.log(
      "PASS: Gaia asks Bean to find three keepsakes, Bean travels and sniffs independently, shortcut traversable, album persists across reload",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
