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
    bad = [],
    art = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) bad.push([r.status(), r.url()]);
    if (r.url().includes("/art/")) art.push(new URL(r.url()).pathname);
  });
  try {
    const url =
      process.env.ARCADE_URL || "http://127.0.0.1:4173/little-worlds/";
    await page.goto(url);
    await page.waitForFunction(
      () => window.arcade?.snapshot().characterArtwork.loaded,
    );
    const state = await page.evaluate(() => window.arcade.snapshot());
    assert.equal(state.characterArtwork.prepared, true);
    assert.equal(state.objectArtwork.prepared, true);
    assert.equal(
      art.length,
      2,
      "normal game boot loads only the atlas and manifest",
    );
    assert.ok(
      art.every((p) => p.startsWith(new URL(url).pathname + "art/")),
      "art URLs respect repository prefix",
    );
    for (const id of [
      "summit",
      "meadow",
      "forest",
      "rally",
      "bricks",
      "garden",
      "space",
    ]) {
      await page.locator(`[data-game="${id}"]`).click();
      await page.locator("#overlay-action").click();
      await page.waitForFunction(() => window.arcade.snapshot().time > 0.05);
      assert.ok(
        (await page.evaluate(() => window.arcade.snapshot())).renderer.calls >
          0,
      );
      await page.locator("#back").click();
    }
    await page.goto(new URL("sprite-lab.html", url).href);
    await page.waitForFunction(() => window.spriteStudio?.status.loaded);
    await page.locator("a").first().click();
    await page.waitForFunction(() => window.arcade?.snapshot());
    assert.deepEqual(bad, []);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        result: "PASS",
        url,
        checks: [
          "repository-prefixed production assets",
          "single native atlas",
          "seven games launch",
          "sprite studio",
          "studio returns to site",
        ],
        art,
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
