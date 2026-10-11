const { chromium } = require("playwright");
const assert = require("node:assert/strict");
require("node:fs").mkdirSync("tests/artifacts", { recursive: true });
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE || undefined,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    window.fakePad = null;
    Object.defineProperty(navigator, "getGamepads", {
      value: () => [window.fakePad],
    });
  });
  await page.goto(process.env.ARCADE_URL || "http://127.0.0.1:5173");
  await page.waitForFunction(
    () => window.arcade?.snapshot().characterArtwork.loaded,
  );
  assert.equal(await page.locator(".game-card").count(), 7);
  assert.equal(
    (await page.evaluate(() => window.arcade.snapshot())).artwork.loaded,
    true,
    "generated world art loaded",
  );
  await page.screenshot({
    path: "tests/artifacts/desktop.png",
    fullPage: true,
  });
  for (const id of [
    "summit",
    "meadow",
    "forest",
    "rally",
    "bricks",
    "garden",
    "space",
  ]) {
    console.log("Checking", id);
    await page.locator(`[data-game="${id}"]`).click();
    await page.locator("#overlay-action").click();
    await page.waitForFunction(() => window.arcade.snapshot().time > 0.15);
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).mode,
      "playing",
    );
    assert.ok(
      (await page.evaluate(() => window.arcade.snapshot())).companion,
      id + " has Bean",
    );
    await page.screenshot({ path: `tests/artifacts/${id}.png` });
    await page.locator("#pause").focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      () => window.arcade.snapshot().mode === "paused",
    );
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).mode,
      "paused",
    );
    const before = await page.evaluate(() => window.arcade.snapshot());
    await page.waitForTimeout(100);
    assert.deepEqual(
      (await page.evaluate(() => window.arcade.snapshot())).player,
      before.player,
    );
    await page.locator("#overlay-action").click();
    await page.locator("#back").click();
  }
  assert.equal(await page.locator("[data-character]").count(), 4);
  assert.equal(await page.locator(".pixel-cover").count(), 7);
  for (const character of ["gaia", "bean", "nur", "arnaud"]) {
    await page.locator("#players").click();
    await page.locator('[data-character="' + character + '"]').click();
    await page.locator("#players-dialog [data-close-dialog]").click();
    await page.reload();
    await page.waitForFunction(() => window.arcade?.snapshot().artwork.loaded);
    assert.equal(
      await page
        .locator('[data-character="' + character + '"]')
        .getAttribute("aria-pressed"),
      "true",
    );
    await page.locator('[data-game="summit"]').click();
    await page.locator("#overlay-action").click();
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => window.arcade.snapshot());
    assert.equal(state.character, character);
    assert.equal(state.framebuffer.height, 180);
    assert.equal(state.framebuffer.width, 320);
    assert.equal(
      await page
        .locator("#game-canvas")
        .evaluate((c) => getComputedStyle(c).imageRendering),
      "pixelated",
    );
    await page.screenshot({
      path: "tests/artifacts/character-" + character + ".png",
    });
    await page.locator("#back").click();
  }
  await page.locator("#players").click();
  await page.locator('[data-character="gaia"]').click();
  await page.locator("#players-dialog [data-close-dialog]").click();
  await page.locator("#profile").click();
  await page.locator("#player-name").fill("Family");
  await page.locator("#profile-dialog .primary").click();
  await page.reload();
  await page.waitForFunction(() => window.arcade?.snapshot().artwork.loaded);
  assert.equal(await page.locator("#profile").textContent(), "F");
  assert.equal(
    await page.locator("#collection-count").textContent(),
    "7 / 7 played",
  );
  await page.locator('[data-game="summit"]').click();
  await page.locator("#overlay-action").click();
  await page.waitForTimeout(200);
  const before = await page.evaluate(() => window.arcade.snapshot().player.x);
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(240);
  await page.keyboard.up("ArrowRight");
  assert.ok(
    (await page.evaluate(() => window.arcade.snapshot().player.x)) > before,
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.arcade.snapshot().mode === "paused");
  assert.equal(
    (await page.evaluate(() => window.arcade.snapshot())).mode,
    "paused",
  );
  await page.locator("#overlay-action").click();
  const pad = async (index, on) =>
    page.evaluate(
      ({ index, on }) => {
        window.fakePad ??= {
          id: "Test standard gamepad",
          connected: true,
          mapping: "standard",
          axes: [0, 0],
          buttons: Array.from({ length: 17 }, () => ({
            pressed: false,
            value: 0,
          })),
        };
        window.fakePad.buttons[index] = { pressed: on, value: on ? 1 : 0 };
      },
      { index, on },
    );
  await pad(9, true);
  await page.waitForTimeout(160);
  assert.equal(
    (await page.evaluate(() => window.arcade.snapshot())).mode,
    "paused",
  );
  await page.waitForTimeout(150);
  assert.equal(
    (await page.evaluate(() => window.arcade.snapshot())).mode,
    "paused",
  );
  await pad(9, false);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await pad(9, true);
  await page.waitForFunction(() => window.arcade.snapshot().mode === "playing");
  assert.equal(
    (await page.evaluate(() => window.arcade.snapshot())).mode,
    "playing",
  );
  await pad(9, false);
  await page.evaluate(() => (window.fakePad = null));
  await page.locator("#back").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "tests/artifacts/mobile.png", fullPage: true });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.locator('[data-game="summit"]').click();
  await page.locator("#overlay-action").click();
  await page.waitForTimeout(200);
  const initial = await page.evaluate(() => window.arcade.snapshot().player);
  const session = await page.context().newCDPSession(page);
  const bounds = await page.locator('[data-key="right"]').boundingBox(),
    jump = await page.locator('[data-key="a"]').boundingBox();
  const touch = (id, b) => ({
    id,
    x: b.x + b.width / 2,
    y: b.y + b.height / 2,
    radiusX: 3,
    radiusY: 3,
    force: 1,
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [touch(0, bounds), touch(1, jump)],
  });
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => window.arcade.snapshot().player);
  assert.ok(after.x > initial.x);
  assert.ok(after.y < initial.y);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.screenshot({ path: "tests/artifacts/mobile-game.png" });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.screenshot({ path: "tests/artifacts/landscape.png" });
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    JSON.stringify({
      result: "PASS",
      checks: [
        "7 rendered games",
        "four family characters persist across reload",
        "320x180 pixel framebuffer and nearest-neighbor display",
        "pause and resume",
        "cartridge shelf",
        "profile persistence",
        "progress persistence",
        "keyboard movement",
        "controller Start held-edge handling",
        "portrait layout",
        "simultaneous touch move+jump",
        "landscape layout",
      ],
      errors,
    }),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
