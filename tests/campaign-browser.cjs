const { chromium } = require("playwright"),
  assert = require("node:assert/strict");
(async () => {
  const { Garden } = await import("../src/games.js"),
    { GARDEN_LEVELS } = await import("../src/levels.js"),
    { solveGarden } = await import("./level-solvers.js");
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
    await page.locator('[data-game="garden"]').click();
    assert.equal(await page.locator("[data-level]").count(), 8);
    await page.locator("#overlay-action").click();
    for (let level = 0; level < GARDEN_LEVELS.length; level++) {
      const g = new Garden(true, undefined, level),
        route = solveGarden(g);
      let x = g.player.x,
        y = g.player.y;
      assert.equal(
        (await page.evaluate(() => window.arcade.snapshot())).level,
        level,
      );
      for (const [dx, dy] of route) {
        x += dx;
        y += dy;
        await page.keyboard.press(
          dx > 0
            ? "ArrowRight"
            : dx < 0
              ? "ArrowLeft"
              : dy > 0
                ? "ArrowDown"
                : "ArrowUp",
        );
        await page.waitForFunction(
          ({ x, y }) => {
            const p = window.arcade.snapshot().player;
            return p.x === x && p.y === y;
          },
          { x, y },
        );
        await page.waitForTimeout(165);
      }
      await page.waitForFunction(() => window.arcade.snapshot().mode === "won");
      const result = await page.evaluate(() => window.arcade.snapshot());
      assert.equal(result.score, g.targets.length);
      assert.equal(Object.keys(result.levelRecords.garden).length, level + 1);
      reports.push({ level, title: g.levelInfo.title, moves: route.length });
      await page.screenshot({
        path: `tests/artifacts/garden-stage-${level + 1}.png`,
      });
      if (level < GARDEN_LEVELS.length - 1) {
        assert.match(
          await page.locator("#overlay-action").textContent(),
          /Next stage/,
        );
        await page.locator("#overlay-action").click();
      }
    }
    await page.locator("#overlay-home").click();
    await page.reload();
    await page.waitForFunction(
      () => window.arcade?.snapshot().characterArtwork.loaded,
    );
    assert.equal(
      Object.keys(
        (await page.evaluate(() => window.arcade.snapshot())).levelRecords
          .garden,
      ).length,
      8,
    );
    await page.locator('[data-game="garden"]').click();
    await page.locator('[data-level="4"]').click();
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).level,
      4,
    );
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        result: "PASS",
        checks: [
          "eight puzzles solved through normal keys",
          "next-stage flow",
          "saved stage records",
          "replay selection",
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
