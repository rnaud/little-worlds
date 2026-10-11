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
  });
  const errors = [];
  const assets = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().includes("/art/")) assets.push(new URL(r.url()).pathname);
  });
  const url = process.env.ARCADE_URL || "http://127.0.0.1:5174";
  await page.goto(url + "/sprite-lab.html");
  await page.waitForFunction(() => window.spriteStudio?.status.loaded);
  await page.screenshot({
    path: "tests/artifacts/animation-studio.png",
    fullPage: true,
  });
  for (const id of ["gaia", "bean", "nur", "arnaud"]) {
    await page.selectOption("#character", id);
    await page.screenshot({
      path: `tests/artifacts/${id}-frames.png`,
      fullPage: true,
    });
  }
  await page.goto(url);
  await page.waitForFunction(
    () => window.arcade?.snapshot().characterArtwork.loaded,
  );
  const stats = await page.evaluate(async () => {
    const {
      characterDebugFrames,
      kartDebugFrames,
      CHARACTER_IDS,
      CHARACTER_FRAME_COUNT,
      loadCharacterArt,
    } = await import("/src/characters.js");
    const creatures = await import("/src/creatures.js"),
      objects = await import("/src/objects.js");
    await Promise.all([
      loadCharacterArt(),
      creatures.loadCreatureArt(),
      objects.loadObjectArt(),
    ]);
    const sources = [
      ...CHARACTER_IDS.map((id) => ({
        id,
        frames: characterDebugFrames(id),
        expected: CHARACTER_FRAME_COUNT,
        palette: id === "bean" ? 16 : 28,
      })),
      ...CHARACTER_IDS.map((id) => ({
        id: id + " kart",
        frames: kartDebugFrames(id),
        expected: 4,
        palette: 28,
      })),
      ...creatures.CREATURE_IDS.map((id) => ({
        id,
        frames: creatures.creatureDebugFrames(id),
        expected: 4,
        palette: 32,
      })),
      ...objects.OBJECT_SPECS.map(([id]) => ({
        id,
        frames: [objects.objectFrame(id)],
        expected: 1,
        palette: 32,
      })),
    ];
    return sources.map(({ id, frames, expected, palette }) => {
      const hashes = [],
        counts = [];
      for (const c of frames) {
        const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        const colors = new Set();
        let hash = 0,
          opaque = 0,
          partial = 0;
        for (let i = 0; i < d.length; i += 4) {
          hash =
            (hash * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7 + d[i + 3] * 11) |
            0;
          if (d[i + 3] === 255) {
            opaque++;
            colors.add(`${d[i]},${d[i + 1]},${d[i + 2]}`);
          } else if (d[i + 3] !== 0) partial++;
        }
        hashes.push(hash);
        counts.push({ opaque, partial, colors: colors.size });
      }
      return { id, expected, palette, unique: new Set(hashes).size, counts };
    });
  });
  for (const s of stats) {
    assert.equal(s.counts.length, s.expected, s.id);
    assert.equal(s.unique, s.expected, s.id + " distinct poses");
    assert.ok(
      s.counts.every((c) => c.opaque > 35 && c.partial === 0),
      s.id + " binary transparent sprites",
    );
    assert.ok(
      s.counts.every((c) => c.colors <= s.palette),
      s.id + " limited palette",
    );
  }
  assert.deepEqual(
    [...new Set(assets)].sort(),
    ["/art/native/arcade-v5.png", "/art/native/manifest.json"],
    "runtime uses only the prepared native atlas",
  );
  await page.locator('[data-game="summit"]').click();
  await page.locator("#overlay-action").click();
  await page.waitForFunction(() => window.arcade.snapshot().player.ground);
  await page.waitForFunction(
    () => window.arcade.snapshot().animation.state === "idle",
  );
  await page.screenshot({ path: "tests/artifacts/animated-summit.png" });
  await page.keyboard.down("ArrowRight");
  await page.waitForFunction(
    () => window.arcade.snapshot().animation.state === "run",
  );
  await page.keyboard.up("ArrowRight");
  await page.keyboard.down("Space");
  await page.waitForFunction(
    () => window.arcade.snapshot().animation.state === "jump",
  );
  await page.screenshot({ path: "tests/artifacts/animated-jump.png" });
  await page.keyboard.up("Space");
  await page.keyboard.press("Shift");
  await page.waitForFunction(
    () => window.arcade.snapshot().animation.state === "dash",
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.arcade.snapshot().mode === "paused");
  const paused = await page.evaluate(() => window.arcade.snapshot().animation);
  await page.waitForTimeout(200);
  assert.deepEqual(
    await page.evaluate(() => window.arcade.snapshot().animation),
    paused,
  );
  assert.deepEqual(errors, []);
  const studio = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1.25,
  });
  await studio.goto(url + "/sprite-lab.html");
  await studio.waitForFunction(() => window.spriteStudio?.status.loaded);
  const studioPixels = await studio.evaluate(() =>
    [...document.querySelectorAll("canvas")].map((c) => {
      const r = c.getBoundingClientRect(),
        d = devicePixelRatio;
      return {
        x: r.x * d,
        y: r.y * d,
        sx: (r.width * d) / c.width,
        sy: (r.height * d) / c.height,
      };
    }),
  );
  for (const canvas of studioPixels)
    for (const [k, value] of Object.entries(canvas))
      assert.ok(
        Math.abs(value - Math.round(value)) < 0.035,
        `studio ${k} ${value}`,
      );
  assert.ok(
    await studio.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await studio.screenshot({
    path: "tests/artifacts/studio-mobile.png",
    fullPage: true,
  });
  await studio.close();
  console.log(
    JSON.stringify({
      result: "PASS",
      assets: [...new Set(assets)],
      stats: stats.map((s) => ({
        id: s.id,
        frames: s.counts.length,
        unique: s.unique,
        colors: Math.max(...s.counts.map((c) => c.colors)),
      })),
      checks: [
        "148 family poses plus karts, creatures and props",
        "binary alpha and limited palettes",
        "one prepared native atlas request",
        "distinct poses",
        "idle/run/jump/dash respond to gameplay",
        "pause freezes animation",
        "studio keeps native pixels on fractional-density mobile screens",
      ],
      errors,
    }),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
