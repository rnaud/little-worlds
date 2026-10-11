const { chromium } = require("playwright"),
  fs = require("node:fs");
(async () => {
  const b = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
  });
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } }),
      frames = [];
    await p.goto(process.env.ARCADE_URL || "http://127.0.0.1:5174");
    await p.waitForFunction(
      () => window.arcade?.snapshot().characterArtwork.loaded,
    );
    for (const id of [
      "summit",
      "meadow",
      "forest",
      "rally",
      "bricks",
      "garden",
      "space",
      "bubbles",
      "splash",
    ]) {
      await p.locator(`[data-game="${id}"]`).click();
      await p.locator("#overlay-action").click();
      await p.waitForFunction(() => window.arcade.snapshot().time > 0.25);
      await p.keyboard.press("Escape");
      await p.waitForFunction(() => window.arcade.snapshot().mode === "paused");
      const image = await p
        .locator("#game-canvas")
        .evaluate(
          (c) =>
            new Promise((resolve) =>
              requestAnimationFrame(() => resolve(c.toDataURL())),
            ),
        );
      frames.push({ id, image });
      await p.locator("#overlay-home").click();
    }
    await p.evaluate((frames) => {
      document.body.innerHTML = "";
      document.body.style =
        "margin:0;padding:24px;background:#181d2d;color:#f7e8c7;font:16px monospace;display:grid;grid-template-columns:repeat(3,384px);gap:16px";
      for (const { id, image } of frames) {
        const cell = document.createElement("div");
        cell.textContent = id;
        const img = new Image();
        img.src = image;
        img.style =
          "display:block;width:320px;height:180px;image-rendering:pixelated;margin-top:8px";
        cell.append(img);
        document.body.append(cell);
      }
    }, frames);
    await p.screenshot({
      path: "tests/artifacts/native-nine-games.png",
      fullPage: true,
    });
    console.log("Nine native game previews saved");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
