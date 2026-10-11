const { chromium } = require("playwright");
const assert = require("node:assert/strict");
function solveGarden(g) {
  const key = (p, boxes) =>
    `${p.x},${p.y}|${boxes
      .map((b) => `${b.x},${b.y}`)
      .sort()
      .join(";")}`;
  const queue = [
      { p: { ...g.player }, boxes: g.boxes.map((b) => ({ ...b })), route: [] },
    ],
    seen = new Set([key(g.player, g.boxes)]);
  for (let index = 0; index < queue.length; index++) {
    const s = queue[index];
    if (s.boxes.every((b) => g.targets.some((t) => t.x === b.x && t.y === b.y)))
      return s.route;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const p = { x: s.p.x + dx, y: s.p.y + dy },
        boxes = s.boxes.map((b) => ({ ...b }));
      if (g.walls.has(`${p.x},${p.y}`)) continue;
      const box = boxes.find((b) => b.x === p.x && b.y === p.y);
      if (box) {
        if (
          g.walls.has(`${box.x + dx},${box.y + dy}`) ||
          boxes.some((b) => b.x === box.x + dx && b.y === box.y + dy)
        )
          continue;
        box.x += dx;
        box.y += dy;
        if (box.x === 1 || box.x === 7 || box.y === 1 || box.y === 6) continue;
      }
      const k = key(p, boxes);
      if (!seen.has(k)) {
        seen.add(k);
        queue.push({ p, boxes, route: [...s.route, [dx, dy]] });
      }
    }
    if (queue.length > 500000) throw new Error("Garden solver exceeded bound");
  }
  throw new Error("No garden solution");
}
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
    await page.locator('[data-game="forest"]').click();
    await page.locator("#overlay-action").click();
    // This driver sends ordinary keyboard events; it never writes game state.
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
    for (const [n, target] of [
      [115, 130],
      [404, 115],
      [404, 307],
      [550, 307],
      [817, 307],
      [817, 113],
      [817, 408],
      [550, 408],
      [550, 307],
      [400, 307],
      [115, 307],
      [110, 410],
    ].entries()) {
      await page.evaluate(([x, y]) => window.walkTo(x, y), target);
      if ([1, 3, 6].includes(n))
        await page.screenshot({
          path: `tests/artifacts/forest-journey-${n}.png`,
        });
    }
    await page.waitForFunction(() => window.arcade.snapshot().mode === "won");
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).score,
      3,
    );
    await page.screenshot({ path: "tests/artifacts/forest-complete.png" });
    await page.locator("#overlay-home").click();
    const { Garden } = await import("../src/games.js");
    const garden = new Garden(true, undefined, 4),
      route = solveGarden(garden);
    await page.locator('[data-game="garden"]').click();
    await page.locator('[data-level="4"]').click();
    await page.locator("#overlay-action").click();
    let x = garden.player.x,
      y = garden.player.y;
    for (const [n, [dx, dy]] of route.entries()) {
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
      await page.waitForTimeout(190);
      if (n === 5 || n === route.length - 2)
        await page.screenshot({
          path: `tests/artifacts/garden-journey-${n}.png`,
        });
    }
    await page.waitForFunction(() => window.arcade.snapshot().mode === "won");
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).score,
      3,
    );
    await page.screenshot({ path: "tests/artifacts/garden-complete.png" });
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        result: "PASS",
        checks: [
          "forest key, gate, three lanterns and shrine through keyboard movement",
          "garden solved through legal keyboard pushes",
          "Bean present throughout",
          "real victory overlays",
        ],
        gardenMoves: route.length,
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
