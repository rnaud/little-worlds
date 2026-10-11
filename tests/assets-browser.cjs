const { chromium } = require("playwright");
const assert = require("node:assert/strict");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
  });
  const reports = [];
  try {
    for (const failure of ["atlas", "all-art"]) {
      const page = await browser.newPage(),
        errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route(
        failure === "atlas" ? "**/art/native/**" : "**/art/**",
        (route) => route.abort(),
      );
      await page.goto(process.env.ARCADE_URL || "http://127.0.0.1:5174");
      await page.waitForFunction(() => window.arcade);
      const art = await page.evaluate(() => window.arcade.snapshot());
      assert.equal(art.characterArtwork.loaded, failure === "atlas");
      assert.equal(art.characterArtwork.prepared, false);
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
        await page.waitForFunction(() => window.arcade.snapshot().time > 0.1);
        const state = await page.evaluate(() => window.arcade.snapshot());
        assert.equal(state.mode, "playing");
        assert.ok(state.renderer.calls > 0);
        await page.locator("#back").click();
      }
      assert.deepEqual(errors, []);
      reports.push({
        failure,
        gamesPlayable: 7,
        artwork: art.characterArtwork.loaded
          ? "local source fallback"
          : "code fallback",
      });
      await page.close();
    }
    console.log(JSON.stringify({ result: "PASS", reports }));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
