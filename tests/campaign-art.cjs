const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
  });
  const page = await browser.newPage({
    viewport: { width: 1340, height: 1100 },
  });
  try {
    await page.goto(
      (process.env.ARCADE_URL || "http://127.0.0.1:5174") + "/sprite-lab.html",
    );
    await page.waitForFunction(() => window.spriteStudio?.status.loaded);
    await page.evaluate(async () => {
      const h = await import("/tests/browser-harness.js"),
        { meadowDriver } = await import("/tests/meadow-driver.js");
      await h.loadArt();
      const stage = document.createElement("div");
      stage.style.cssText =
        "width:960px;height:540px;position:fixed;left:0;top:0";
      const canvas = document.createElement("canvas");
      stage.append(canvas);
      document.body.append(stage);
      const p = new h.engine.Painter(canvas),
        captures = [];
      for (let level = 0; level < 6; level++) {
        const g = new h.games.Platformer("meadow", true, undefined, level),
          driver = meadowDriver(level);
        for (let n = 0; n < 360; n++) g.update(1 / 120, driver.input(g));
        g.draw(p);
        p.finish();
        captures.push({ title: g.levelInfo.title, image: canvas.toDataURL() });
      }
      for (let level = 0; level < 8; level++) {
        const g = new h.games.Garden(true, undefined, level);
        g.draw(p);
        p.finish();
        captures.push({ title: g.levelInfo.title, image: canvas.toDataURL() });
      }
      const f = new h.games.Forest(true);
      f.draw(p);
      p.finish();
      captures.push({
        title: "Lantern Woods · roots",
        image: canvas.toDataURL(),
      });
      p.dispose();
      document.body.innerHTML =
        "<h1>Campaign scenes · native renderer</h1><main></main>";
      document.querySelector("main").style.cssText =
        "display:grid;grid-template-columns:repeat(3, 420px);gap:14px";
      for (const c of captures) {
        const figure = document.createElement("figure");
        figure.style.cssText = "margin:0;background:#25283c";
        const image = document.createElement("img");
        image.src = c.image;
        image.style.cssText =
          "width:320px;height:180px;image-rendering:pixelated;display:block;margin:auto";
        const label = document.createElement("figcaption");
        label.textContent = c.title;
        figure.append(image, label);
        document.querySelector("main").append(figure);
      }
    });
    await page.screenshot({
      path: "tests/artifacts/campaign-contact.png",
      fullPage: true,
    });
    console.log("Saved 15 campaign scenes for visual inspection");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
