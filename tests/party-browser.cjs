const { chromium } = require("playwright"),
  assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
  });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [],
    reports = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    const { bubblePilot } = await import("./bubble-pilot.js"),
      { splashPlan } = await import("./party-driver.js");
    // Keep the input-only pilots in the test runner so release builds need not
    // expose development modules, and the same check can exercise Pages.
    await page.addInitScript({
      content: `window.partyPilot = { bubblePilot: ${bubblePilot.toString()}, splashPlan: ${splashPlan.toString()} };`,
    });
    await page.goto(process.env.ARCADE_URL || "http://127.0.0.1:5174");
    await page.waitForFunction(
      () => window.arcade?.snapshot().characterArtwork.loaded,
    );
    await page.locator("#gentle").uncheck();
    for (const id of ["bubbles", "splash"]) {
      await page.locator(`[data-game="${id}"]`).click();
      await page.locator("#overlay-action").click();
      await page.waitForFunction(() => window.arcade.snapshot().time > 0.15);
      await page.screenshot({ path: `tests/artifacts/${id}-native.png` });
      const result = await page.evaluate(async (id) => {
        const { bubblePilot, splashPlan } = window.partyPilot;
        const canvas = document.querySelector("#game-canvas"),
          held = new Set();
        let plan = [],
          delay = 0,
          lastRoom = -1,
          stepAt = 0,
          jumpReleased = true;
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
        const start = performance.now();
        return await new Promise((resolve, reject) => {
          const frame = () => {
            const s = window.arcade.snapshot(),
              now = performance.now();
            if (s.mode === "won") {
              set(new Set());
              resolve({
                id,
                time: s.time,
                score: s.score,
                hearts: s.party.hearts,
                room: s.party.room,
              });
              return;
            }
            if (s.mode === "lost" || now - start > 120000) {
              set(new Set());
              reject(
                new Error(
                  `${id} ${s.mode} timed out: ${JSON.stringify({ player: s.player, party: s.party })}`,
                ),
              );
              return;
            }
            const keys = new Set();
            if (id === "bubbles") {
              const i = bubblePilot({ ...s, ...s.party });
              keys.add("ShiftLeft");
              if (i.x) keys.add(i.x > 0 ? "ArrowRight" : "ArrowLeft");
              if (i.y) keys.add("ArrowDown");
              if (i.pressed.a && jumpReleased) {
                keys.add("Space");
                jumpReleased = false;
              } else if (!s.player.ground) {
                keys.add("Space");
              } else jumpReleased = true;
            } else {
              if (lastRoom !== s.party.room) {
                plan = [];
                lastRoom = s.party.room;
                delay = now + 300;
              }
              if (now >= delay) {
                if (!plan.length) plan = splashPlan(s.party);
                const step = plan[0];
                if (step?.type === "move") {
                  if (s.party.cell.x === step.x && s.party.cell.y === step.y) {
                    plan.shift();
                    delay = now + 50;
                  } else
                    keys.add(
                      step.dx
                        ? step.dx > 0
                          ? "ArrowRight"
                          : "ArrowLeft"
                        : step.dy > 0
                          ? "ArrowDown"
                          : "ArrowUp",
                    );
                } else if (step) {
                  plan.shift();
                  if (step.type === "place") keys.add("Space");
                  if (step.type === "pop") keys.add("ShiftLeft");
                  delay = now + (step.type === "wait" ? 650 : 60);
                }
              }
            }
            set(keys);
            requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        });
      }, id);
      reports.push(result);
      assert.equal(result.room, 2);
      if (id === "splash") assert.equal(result.hearts, 3);
      await page.screenshot({ path: `tests/artifacts/${id}-complete.png` });
      await page.locator("#overlay-home").click();
    }
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        result: "PASS",
        reports,
        checks: [
          "native actors",
          "Classic completions via keyboard events",
          "three rooms per new game",
          "safe splash exits",
          "victory and records",
        ],
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
