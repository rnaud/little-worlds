const { chromium } = require("playwright"),
  assert = require("node:assert/strict");
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
      () => window.arcade?.snapshot().objectArtwork.loaded,
    );
    const levels = await page.evaluate(async () => {
      const { Sound } = await import("/src/engine.js"),
        { THEMES, themeStep } = await import("/src/music.js"),
        results = [];
      for (const [id, theme] of Object.entries(THEMES)) {
        const context = new OfflineAudioContext(1, 44100 * 15, 44100),
          sound = new Sound();
        sound.enabled = true;
        sound.ctx = context;
        sound.unlock = () => {};
        for (let n = 0; n < 32; n++)
          for (const note of themeStep(id, n))
            sound.play(
              note.frequency,
              note.duration,
              note.type,
              (n * 60) / theme.bpm / 2,
              note.level,
            );
        const buffer = await context.startRendering(),
          samples = buffer.getChannelData(0);
        let peak = 0,
          sum = 0;
        for (const sample of samples) {
          peak = Math.max(peak, Math.abs(sample));
          sum += sample * sample;
        }
        results.push({ id, peak, rms: Math.sqrt(sum / samples.length) });
      }
      return results;
    });
    for (const { id, peak, rms } of levels) {
      assert.ok(peak < 0.08, id + " unclipped quiet mix");
      assert.ok(rms > 0.001, id + " audible theme");
    }
    const effects = await page.evaluate(async () => {
      const { Sound } = await import("/src/engine.js");
      const results = [];
      for (const name of [
        "pickup",
        "victory",
        "jump",
        "dash",
        "select",
        "wand",
        "plant",
        "push",
        "undo",
        "launch",
        "bounce",
        "shield",
        "shot",
        "bump",
        "respawn",
        "spring",
        "checkpoint",
      ]) {
        const context = new OfflineAudioContext(1, 44100, 44100),
          sound = new Sound();
        sound.ctx = context;
        sound.unlock = () => {};
        sound.effect(name);
        const samples = (await context.startRendering()).getChannelData(0);
        let peak = 0,
          energy = 0;
        for (const sample of samples) {
          peak = Math.max(peak, Math.abs(sample));
          energy += sample * sample;
        }
        results.push({
          name,
          peak,
          energy,
          signature: Array.from(
            samples.filter((_, n) => n % 97 === 0),
            (n) => Math.round(n * 1e6),
          ).join(","),
        });
      }
      return results;
    });
    assert.equal(
      new Set(effects.map((e) => e.signature)).size,
      effects.length,
      "action cues have distinct waveforms",
    );
    for (const effect of effects) {
      assert.ok(
        effect.peak > 0.005 && effect.peak < 0.16,
        effect.name + " audible and unclipped",
      );
      assert.ok(
        effect.energy > 0.005,
        effect.name + " has a complete envelope",
      );
    }
    await page.locator('[data-game="space"]').click();
    await page.locator("#overlay-action").click();
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).audio.enabled,
      true,
    );
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "game-canvas",
    );
    await page.waitForFunction(() => window.arcade.snapshot().audio.voices > 0);
    await page.locator("#sound").click();
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).audio.voices,
      0,
    );
    await page.reload();
    await page.waitForFunction(() => window.arcade?.snapshot());
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).audio.enabled,
      false,
      "mute survives reload",
    );
    await page.locator('[data-game="space"]').click();
    await page.locator("#overlay-action").click();
    await page.locator("#profile").click();
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).mode,
      "paused",
    );
    const time = await page.evaluate(() => window.arcade.snapshot().time);
    await page.waitForTimeout(250);
    assert.equal(
      await page.evaluate(() => window.arcade.snapshot().time),
      time,
    );
    await page.keyboard.press("Escape");
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "overlay-action",
    );
    await page.locator("#overlay-home").click();
    await page.locator('[data-game="garden"]').click();
    await page.locator("#overlay-action").click();
    await page.waitForTimeout(200);
    const mutations = await page.evaluate(
      () =>
        new Promise((resolve) => {
          let count = 0;
          const observer = new MutationObserver(() => count++);
          observer.observe(document.querySelector("#game-hint"), {
            subtree: true,
            childList: true,
            characterData: true,
          });
          setTimeout(() => {
            observer.disconnect();
            resolve(count);
          }, 400);
        }),
    );
    assert.equal(
      mutations,
      0,
      "unchanged live hints are not announced repeatedly",
    );
    await page.locator("#back").click();
    await page.locator("#sound").click();
    await page.locator('[data-game="rally"]').click();
    await page.locator("#overlay-action").click();
    await page.waitForFunction(() => window.arcade.snapshot().audio.motor);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => window.arcade.snapshot().mode === "paused");
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).audio.motor,
      false,
      "pause stops the motor",
    );
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).audio.voices,
      0,
      "pause stops every voice",
    );
    await page.locator("#overlay-action").click();
    await page.waitForFunction(() => window.arcade.snapshot().audio.motor);
    await page.locator("#sound").click();
    assert.equal(
      (await page.evaluate(() => window.arcade.snapshot())).audio.motor,
      false,
      "mute stops the motor",
    );
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        result: "PASS",
        levels,
        effects: effects.map(({ name, peak }) => ({ name, peak })),
        checks: [
          "quiet original themes",
          "17 distinct action cues",
          "motor stops on pause and mute",
          "immediate mute",
          "sound returns game focus",
          "profile pauses simulation",
          "dialog returns pause focus",
          "stable live hints",
        ],
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
