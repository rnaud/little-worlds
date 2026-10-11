const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
  });
  const page = await b.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto("http://127.0.0.1:5174");
  await page.waitForFunction(
    () => window.arcade?.snapshot().objectArtwork.loaded,
  );
  for (const id of ["summit", "meadow", "rally"]) {
    await page.locator(`[data-game="${id}"]`).click();
    await page.locator("#overlay-action").click();
    await page.waitForTimeout(id === "rally" ? 4000 : 300);
    await page
      .locator("#game-canvas")
      .screenshot({ path: `tests/artifacts/new-${id}.png` });
    await page.keyboard.press("Escape");
    await page.locator("#overlay-home").click();
  }
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
