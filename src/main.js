import { loadCreatureArt, creatureArtStatus } from "./creatures.js";
import { loadObjectArt, objectArtStatus, objectFrame } from "./objects.js";
import { clipFrame } from "./animation.js";
import { games } from "./catalog.js";
import { readRecords, finishRecord, clockLabel } from "./records.js";
import { levelsFor, KEEPSAKES } from "./levels.js";
import { art } from "./art.js";
import { FAMILY, portrait } from "./pixels.js";
import { Painter, Input, Sound } from "./engine.js";
import { createGame } from "./games.js";
import { loadWorldArt, artStatus, WORLDS } from "./world-art.js";
import {
  loadCharacterArt,
  characterArtStatus,
  characterPreview,
  characterFrame,
} from "./characters.js";
document.querySelector("#game-grid").textContent = "Loading your cartridges…";
await Promise.all([
  loadWorldArt(),
  loadCharacterArt(),
  loadCreatureArt(),
  loadObjectArt(),
]);
const $ = (s) => document.querySelector(s);
const storage = {
  read() {
    try {
      return JSON.parse(localStorage.getItem("little-worlds-v1")) || {};
    } catch {
      return {};
    }
  },
  write(data) {
    try {
      localStorage.setItem("little-worlds-v1", JSON.stringify(data));
    } catch {}
  },
};
const saved = storage.read();
const records = readRecords(saved.records);
let runGentle = true;
const keepsakes = new Set(
  (Array.isArray(saved.keepsakes) ? saved.keepsakes : []).filter((id) =>
    KEEPSAKES.some((s) => s.id === id),
  ),
);
const levelRecords = {};
for (const id of ["meadow", "garden"]) {
  levelRecords[id] = {};
  for (const [key, record] of Object.entries(saved.levelRecords?.[id] || {})) {
    if (
      /^\d+$/.test(key) &&
      Number(key) < levelsFor(id).length &&
      record &&
      typeof record === "object"
    )
      levelRecords[id][key] = record;
  }
  if (!Object.keys(levelRecords[id]).length && saved.won?.includes?.(id))
    levelRecords[id][id === "garden" ? 4 : 0] = { completed: true };
}
let name = typeof saved.name === "string" ? saved.name : "Gaia",
  gentle = saved.gentle !== false,
  explored = new Set(Array.isArray(saved.explored) ? saved.explored : []),
  won = new Set(Array.isArray(saved.won) ? saved.won : []),
  filter = "all";
let character = FAMILY.some((f) => f.id === saved.character)
  ? saved.character
  : "gaia";
const input = new Input(),
  sound = new Sound();
sound.enabled = saved.sound !== false;
for (const event of ["pointerdown", "keydown"])
  document.addEventListener(event, () => sound.unlock(), { passive: true });
let painter,
  game,
  selected,
  mode = "home",
  last = 0,
  toastTimer,
  wasPad = false;
let currentLevel = 0;
let coopEnabled = saved.coopEnabled === true,
  coopTouch = saved.coopTouch === true;
let coopHero = ["gaia", "nur", "arnaud"].includes(saved.coopHero)
  ? saved.coopHero
  : "nur";
const save = () =>
  storage.write({
    name,
    character,
    gentle,
    sound: sound.enabled,
    explored: [...explored],
    won: [...won],
    levelRecords,
    records,
    keepsakes: [...keepsakes],
    coopEnabled,
    coopTouch,
    coopHero,
  });
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 2600);
}
// Align decorative raster artwork to the same physical-pixel rules as the game.
const artObserver = new ResizeObserver((entries) => {
  const dpr = window.devicePixelRatio || 1;
  for (const { target } of entries) {
    const img = target.querySelector(".pixel-cover");
    if (!img) continue;
    const r = target.getBoundingClientRect();
    const scale = Math.max(
      1,
      Math.floor(
        Math.min(
          (target.clientWidth * dpr) / 256,
          (target.clientHeight * dpr) / 160,
        ),
      ),
    );
    const width = (256 * scale) / dpr,
      height = (160 * scale) / dpr;
    Object.assign(img.style, {
      width: `${width}px`,
      height: `${height}px`,
      transform: "none",
      left: `${Math.round((r.left + target.clientLeft + (target.clientWidth - width) / 2) * dpr) / dpr - r.left - target.clientLeft}px`,
      top: `${Math.round((r.top + target.clientTop + (target.clientHeight - height) / 2) * dpr) / dpr - r.top - target.clientTop}px`,
    });
  }
});
function observePixelArt() {
  artObserver.disconnect();
  document
    .querySelectorAll(".card-art, .hero-art")
    .forEach((el) => artObserver.observe(el));
}
function finished(id) {
  const stages = levelsFor(id);
  return stages.length
    ? Object.keys(levelRecords[id] || {}).length === stages.length
    : won.has(id);
}
function cards() {
  const list = games.filter((g) => filter === "all" || g.group === filter);
  $("#game-grid").innerHTML = list
    .map(
      (g) =>
        `<button class="game-card" data-game="${g.id}" aria-label="Play ${g.title}" style="--card-color:${g.color};--card-ink:${g.ink}"><span class="cartridge-ridge" aria-hidden="true"></span><div class="card-art"><span class="card-number">0${games.indexOf(g) + 1}</span>${art(g.icon)}</div><div class="card-content"><span class="card-genre">${g.genre}</span><h3>${g.title}</h3><span class="cartridge-progress">${levelsFor(g.id).length ? `${Object.keys(levelRecords[g.id] || {}).length}/${levelsFor(g.id).length} stages` : finished(g.id) ? "★ Completed" : g.time}</span><span class="cartridge-play" aria-hidden="true">Ⓐ</span></div></button>`,
    )
    .join("");
  $("#collection-count").textContent =
    `${games.filter((g) => explored.has(g.id)).length} / ${games.length} played`;
  for (const b of document.querySelectorAll("[data-game]"))
    b.onclick = () => launch(b.dataset.game);
  observePixelArt();
}
function renderFamily() {
  $("#family-party").innerHTML = FAMILY.map(
    (f) =>
      `<button class="family-member ${f.id === character ? "selected" : ""}" data-character="${f.id}" aria-pressed="${f.id === character}" title="${f.bio}">${characterPreview(f.id) ? `<img class="pixel-portrait" src="${characterPreview(f.id)}" alt="${f.name} pixel sprite"/>` : portrait(f.id)}<span><b>${f.name}</b></span><span class="party-select">${f.id === character ? "P1" : "+"}</span></button>`,
  ).join("");
  document.querySelectorAll("[data-character]").forEach(
    (button) =>
      (button.onclick = () => {
        character = button.dataset.character;
        name = FAMILY.find((f) => f.id === character).name;
        if (painter) painter.hero = character;
        $("#profile").textContent = name[0];
        save();
        renderFamily();
        document.querySelector(`[data-character="${character}"]`)?.focus();
        toast(name + " is ready!");
      }),
  );
  requestAnimationFrame(scaleFamilyPortraits);
}
const keepsakeIcons = new Map();
function renderAlbum() {
  $("#keepsake-album").innerHTML = KEEPSAKES.map((s) => {
    if (!keepsakeIcons.has(s.id)) {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 40;
      const context = canvas.getContext("2d"),
        source = objectFrame(s.object);
      context.imageSmoothingEnabled = false;
      if (source)
        context.drawImage(
          source,
          Math.floor((40 - source.width) / 2),
          Math.floor((40 - source.height) / 2),
        );
      keepsakeIcons.set(s.id, canvas.toDataURL());
    }
    const found = keepsakes.has(s.id);
    return `<article class="keepsake-card ${found ? "found" : "undiscovered"}"><img class="keepsake-icon" src="${keepsakeIcons.get(s.id)}" alt="${found ? s.title : "Unfound keepsake"}"/><div><h3>${found ? s.title : `Something for ${s.owner}`}</h3><p>${found ? s.story : "Hidden among the ferns. Bean knows where to look."}</p></div><span>${found ? "✓" : "?"}</span></article>`;
  }).join("");
  requestAnimationFrame(scaleFamilyPortraits);
}
function scaleFamilyPortraits() {
  const dpr = devicePixelRatio || 1,
    zoom = Math.max(1, Math.floor(dpr));
  document.documentElement.style.setProperty("--pixel-ratio", String(dpr));
  const portraits = [
    ...document.querySelectorAll(".pixel-portrait,.keepsake-icon"),
  ];
  // Size every sibling first: changing the final portrait can move the entire row.
  for (const img of portraits) {
    img.style.width = img.style.height = `${(40 * zoom) / dpr}px`;
    img.style.translate = "none";
  }
  for (const img of portraits) {
    const r = img.getBoundingClientRect();
    img.style.translate = `${Math.round(r.x * dpr) / dpr - r.x}px ${Math.round(r.y * dpr) / dpr - r.y}px`;
  }
}
window.addEventListener("resize", scaleFamilyPortraits);
renderFamily();
renderAlbum();
$("#album-explore").onclick = () => {
  $("#album-dialog").close();
  launch("forest");
};

for (const b of document.querySelectorAll("[data-filter]"))
  b.onclick = () => {
    filter = b.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((n) => {
      const active = n === b;
      n.classList.toggle("active", active);
      n.setAttribute("aria-pressed", String(active));
    });
    cards();
  };
$("#gentle").checked = gentle;
$("#gentle").onchange = (e) => {
  gentle = e.target.checked;
  save();
};
let dialogReturn = null;
function openDialog(id, trigger) {
  menuNeutral = true;
  if (mode === "playing") pause();
  dialogReturn = trigger;
  const dialog = $(id);
  dialog.showModal();
  focusMenu(dialog.querySelector('[aria-pressed="true"],button'));
  requestAnimationFrame(scaleFamilyPortraits);
  input.clear();
}
$("#players").onclick = () => openDialog("#players-dialog", $("#players"));
$("#album-open").onclick = () => openDialog("#album-dialog", $("#album-open"));
for (const b of document.querySelectorAll("[data-close-dialog]"))
  b.onclick = () => b.closest("dialog").close();
for (const dialog of document.querySelectorAll("dialog"))
  dialog.addEventListener("close", () => {
    input.clear();
    focusMenu(
      mode === "home" ? dialogReturn || $("#profile") : $("#overlay-action"),
    );
  });
$("#name-keys").innerHTML = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "Space", "⌫"]
  .map(
    (key) =>
      `<button type="button" data-letter="${key}" aria-label="${key === "⌫" ? "Delete last letter" : key}">${key}</button>`,
  )
  .join("");
for (const button of $("#name-keys").querySelectorAll("button"))
  button.onclick = () => {
    const field = $("#player-name"),
      letter = button.dataset.letter;
    field.value =
      letter === "⌫"
        ? field.value.slice(0, -1)
        : (field.value + (letter === "Space" ? " " : letter)).slice(0, 24);
  };
$("#profile").textContent = name.slice(0, 1).toUpperCase() || "G";
$("#profile").onclick = () => {
  if (mode === "playing") pause();
  $("#player-name").value = name;
  openDialog("#profile-dialog", $("#profile"));
  if (!input.padName) $("#player-name").focus();
};
$("#profile-dialog").addEventListener("close", () => {
  if (mode === "paused") $("#overlay-action").focus({ preventScroll: true });
});
$("#profile-dialog form").addEventListener("submit", () => {
  name = $("#player-name").value.trim() || "Gaia";
  $("#profile").textContent = name.slice(0, 1).toUpperCase();
  save();
  toast(`Welcome, ${name}!`);
});
function updateSoundButton() {
  $("#sound").innerHTML =
    `♪ <span>Sound ${sound.enabled ? "on" : "off"}</span>`;
  $("#sound").setAttribute(
    "aria-label",
    `${sound.enabled ? "Disable" : "Enable"} sound`,
  );
  $("#sound").setAttribute("aria-pressed", String(sound.enabled));
}
updateSoundButton();
$("#sound").onclick = () => {
  sound.enabled = !sound.enabled;
  sound.unlock();
  updateSoundButton();
  if (sound.enabled) sound.play();
  else sound.stop();
  save();
  if (mode === "playing") $("#game-canvas").focus({ preventScroll: true });
};
$("#surprise").onclick = () => {
  const choices = games.filter((g) => !explored.has(g.id));
  launch(
    (choices.length ? choices : games)[
      Math.floor(Math.random() * (choices.length || games.length))
    ].id,
  );
};
function overlay(label, title, copy, action) {
  menuNeutral = true;
  $("#game-overlay").dataset.mode = mode;
  $("#overlay-results").hidden = mode !== "won";
  $("#overlay-label").textContent = label;
  $("#overlay-title").textContent = title;
  $("#overlay-copy").textContent = copy;
  $("#overlay-action").textContent = action;
  $("#overlay-replay").hidden =
    mode !== "won" ||
    !levelsFor(selected.id).length ||
    currentLevel >= levelsFor(selected.id).length - 1;
  $("#level-picker").hidden =
    mode !== "intro" || !levelsFor(selected.id).length;
  $("#coop-settings").hidden = mode !== "intro" || selected.id !== "meadow";
  $("#overlay-sound").hidden = mode !== "paused";
  $("#overlay-sound").textContent =
    `Sound: ${sound.enabled ? "on" : "off"} · change`;
  $("#overlay-restart").hidden = mode !== "paused";
  $("#overlay-assist").hidden = mode !== "paused";
  $("#overlay-assist").textContent =
    `Gentle mode: ${gentle ? "on" : "off"} · change`;
  $("#game-overlay").hidden = false;
  $("#victory-party").hidden = mode !== "won";
  if (mode === "won") resizeVictoryParty();
  focusMenu($("#overlay-action"));
  if (mode === "won") requestAnimationFrame(resizeVictoryParty);
}
function resizeVictoryParty() {
  const canvas = $("#victory-party"),
    dpr = devicePixelRatio || 1;
  const available = Math.min(320, canvas.parentElement.clientWidth - 40);
  const zoom = Math.max(1, Math.floor((available * dpr) / 160));
  canvas.style.width = `${(160 * zoom) / dpr}px`;
  canvas.style.height = `${(48 * zoom) / dpr}px`;
  canvas.style.translate = "none";
  const r = canvas.getBoundingClientRect();
  canvas.style.translate = `${Math.round(r.x * dpr) / dpr - r.x}px ${Math.round(r.y * dpr) / dpr - r.y}px`;
}
function drawVictoryParty(time) {
  resizeVictoryParty();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) time = 0;
  const canvas = $("#victory-party"),
    ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 160, 48);
  ctx.imageSmoothingEnabled = false;
  ["gaia", "bean", "nur", "arnaud"].forEach((id, index) => {
    const source = characterFrame(id, "celebrate", time + index * 0.15);
    if (source) ctx.drawImage(source, [6, 37, 81, 116][index], 4);
  });
}
window.addEventListener("resize", resizeVictoryParty);
$(".overlay-card").addEventListener("scroll", () => {
  if (mode === "won") resizeVictoryParty();
});
function launch(id, level) {
  sound.stop();
  selected = games.find((g) => g.id === id);
  if (!selected) return;
  const levels = levelsFor(id);
  const next = levels.findIndex((_, n) => !levelRecords[id]?.[n]);
  currentLevel = levels.length
    ? Math.max(
        0,
        Math.min(
          levels.length - 1,
          Number.isInteger(level) ? level : Math.max(0, next),
        ),
      )
    : 0;
  $("#home").hidden = true;
  $("#play").hidden = false;
  document.body.classList.add("playing");
  window.scrollTo({ top: 0, behavior: "instant" });
  try {
    painter ??= new Painter($("#game-canvas"));
    painter.resize();
  } catch (err) {
    console.error(err);
    home();
    toast("This browser needs WebGL to open a world. Try an updated browser.");
    return;
  }
  input.clear();
  input.enabled = true;
  painter.hero = character;
  runGentle = gentle;
  game = createGame(id, gentle, sound, { level: currentLevel });
  game.hero = character;
  configureCoop();
  $("#game-hint").textContent = "";
  $("#game-title").textContent = game.levelInfo
    ? `${currentLevel + 1}. ${game.levelInfo.title}`
    : selected.title;
  $("#game-genre").textContent =
    selected.genre + " · " + FAMILY.find((f) => f.id === character).name;
  $("#game-objective").textContent = game.objective || selected.objective;
  $("#game-help").textContent = playHelp();
  $("#game-canvas").setAttribute(
    "aria-label",
    `${selected.title}: ${WORLDS[id].name}`,
  );
  document.querySelector(".game-stage").style.borderColor = WORLDS[id].accent;
  $("#touch-a").textContent = `A · ${selected.a}`;
  $("#touch-b").textContent = `B · ${selected.b}`;
  $("#game-score").textContent = "Ready when you are";
  $("#pause").textContent = "Ⅱ Pause";
  mode = "intro";
  $("#level-picker").innerHTML = levels
    .map(
      (entry, n) =>
        `<button class="level-button" data-level="${n}" aria-pressed="${n === currentLevel}"><b>${levelRecords[id]?.[n] ? "✓" : n + 1}</b> ${entry.title}</button>`,
    )
    .join("");
  for (const button of $("#level-picker").querySelectorAll("button"))
    button.onclick = () => launch(id, Number(button.dataset.level));
  overlay(
    gentle
      ? "GENTLE MODE · YOUR PACE, YOUR ADVENTURE"
      : "CLASSIC MODE · A LITTLE CHALLENGE",
    game.levelInfo ? game.levelInfo.title : selected.title,
    game.levelInfo
      ? `${game.levelInfo.lesson} ${selected.help}`
      : `${selected.objective}. ${selected.help}`,
    `Let’s play, ${name} ↗`,
  );
  game.draw(painter);
  painter.finish();
}
function start() {
  input.clear();
  sound.unlock();
  sound.effect("select");
  mode = "playing";
  explored.add(selected.id);
  save();
  $("#game-overlay").hidden = true;
  $("#pause").textContent = "Ⅱ Pause";
  $("#game-canvas").focus({ preventScroll: true });
  fitPlayView();
}
function playHelp() {
  if (!game?.buddy) return selected?.help || "";
  return coopTouch
    ? "Lead: touch controls · Helper: controller A jump, B sprint, Y return · Shared bananas"
    : "Lead: arrows + Space + Shift / controller 1 · Helper: WASD + F jump + G sprint, Q return / controller 2";
}
function configureCoop() {
  if (coopHero === character) coopHero = character === "nur" ? "arnaud" : "nur";
  game?.setBuddy?.(selected.id === "meadow" && coopEnabled, coopHero);
  input.coopTouch = coopTouch;
  $("#coop-on").checked = coopEnabled;
  $("#coop-touch").checked = coopTouch;
  $("#coop-details").hidden = !coopEnabled;
  $("#coop-partners").innerHTML = FAMILY.filter(
    (f) => f.id !== "bean" && f.id !== character,
  )
    .map(
      (f) =>
        `<button class="helper-button" data-helper="${f.id}" aria-pressed="${coopHero === f.id}">${f.name}</button>`,
    )
    .join("");
  for (const button of $("#coop-partners").querySelectorAll("button"))
    button.onclick = () => {
      coopHero = button.dataset.helper;
      configureCoop();
      save();
      $("#coop-partners").querySelector(`[data-helper="${coopHero}"]`).focus();
    };
  $("#coop-instructions").textContent =
    playHelp() +
    ". Helpers return safely if they fall or get left behind. Bean keeps following the lead player.";
  if (selected) $("#game-help").textContent = playHelp();
}
$("#coop-on").onchange = (e) => {
  coopEnabled = e.target.checked;
  configureCoop();
  save();
};
$("#coop-touch").onchange = (e) => {
  coopTouch = e.target.checked;
  configureCoop();
  save();
};
function fitPlayView() {
  if (mode !== "playing" || document.querySelector("dialog[open]")) return;
  if (matchMedia("(orientation:landscape)").matches) {
    window.scrollTo({ top: 0, behavior: "instant" });
  } else if (innerWidth <= 620) {
    const controls = $(".touch-controls").getBoundingClientRect();
    if (controls.bottom > innerHeight)
      window.scrollBy({
        top: controls.bottom - innerHeight + 8,
        behavior: "instant",
      });
  }
}
matchMedia("(orientation:landscape)").addEventListener("change", () =>
  requestAnimationFrame(fitPlayView),
);
function home() {
  menuNeutral = true;
  sound.stop();
  mode = "home";
  input.enabled = false;
  input.clear();
  $("#play").hidden = true;
  $("#home").hidden = false;
  document.body.classList.remove("playing");
  cards();
  requestAnimationFrame(scaleFamilyPortraits);
  const target = selected
    ? document.querySelector(`[data-game="${selected.id}"]`)
    : $("[data-game]");
  target?.focus();
}
function pause() {
  if (mode === "playing") {
    mode = "paused";
    sound.stop();
    input.clear();
    $("#pause").textContent = "▶ Resume";
    overlay(
      "A LITTLE BREATHER",
      "Cloud break.",
      `${selected.help}. ${game.hint || "Your adventure will be right here."}`,
      "Keep playing →",
    );
  } else if (mode === "paused") start();
}
$("#overlay-sound").onclick = () => {
  $("#sound").click();
  $("#overlay-sound").textContent =
    `Sound: ${sound.enabled ? "on" : "off"} · change`;
};
$("#overlay-assist").onclick = () => {
  gentle = !gentle;
  game.gentle = gentle;
  runGentle ||= gentle;
  if (game.paddle) game.paddle.w = gentle ? 160 : 118;
  $("#gentle").checked = gentle;
  save();
  $("#overlay-assist").textContent =
    `Gentle mode: ${gentle ? "on" : "off"} · change`;
};
$("#back").onclick = home;
$("#overlay-home").onclick = home;
$("#pause").onclick = pause;
$("#overlay-restart").onclick = $("#restart").onclick = () => {
  if (selected) launch(selected.id, currentLevel);
};
$("#overlay-replay").onclick = () => {
  launch(selected.id, currentLevel);
  start();
};
$("#overlay-action").onclick = () => {
  if (mode === "intro" || mode === "paused") start();
  else if (mode === "won" || mode === "lost") {
    launch(
      selected.id,
      mode === "won" && currentLevel < levelsFor(selected.id).length - 1
        ? currentLevel + 1
        : currentLevel,
    );
    start();
  }
};
window.addEventListener("blur", () => {
  if (mode === "playing") pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && mode === "playing") pause();
});
// Spatial navigation follows the visible layout, including nested scrolling menus.
let menuDirection = "",
  menuRepeatAt = 0,
  menuNeutral = false;
function menuTargets() {
  const dialog = document.querySelector("dialog[open]");
  const root = dialog || (mode === "home" ? document : $("#game-overlay"));
  return [
    ...root.querySelectorAll("button,input[type=checkbox],a[href]"),
  ].filter(
    (el) =>
      !el.disabled &&
      el.getClientRects().length &&
      !el.closest("[hidden]") &&
      (dialog || mode !== "home" || !el.closest("#play")),
  );
}
function focusMenu(el) {
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({
    block: "nearest",
    inline: "nearest",
    behavior: "instant",
  });
}
function navigateMenu(targets, direction) {
  const from = document.activeElement;
  if (!targets.includes(from)) {
    focusMenu(mode === "home" ? $("[data-game]") : targets[0]);
    return;
  }
  const r = from.getBoundingClientRect(),
    horizontal = direction === "left" || direction === "right";
  const sign = direction === "left" || direction === "up" ? -1 : 1;
  let best = null,
    bestScore = Infinity;
  for (const el of targets) {
    if (el === from) continue;
    if (
      from.dataset.game &&
      horizontal &&
      (!el.dataset.game || Math.abs(el.getBoundingClientRect().y - r.y) > 4)
    )
      continue;
    const b = el.getBoundingClientRect();
    const primary =
      sign *
      (horizontal
        ? b.x + b.width / 2 - r.x - r.width / 2
        : b.y + b.height / 2 - r.y - r.height / 2);
    if (primary < 2) continue;
    const cross = Math.abs(
      horizontal
        ? b.y + b.height / 2 - r.y - r.height / 2
        : b.x + b.width / 2 - r.x - r.width / 2,
    );
    const overlap = horizontal
      ? b.top < r.bottom && b.bottom > r.top
      : b.left < r.right && b.right > r.left;
    const score = primary + cross * 2 + (overlap ? 0 : 1000);
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  focusMenu(best);
}
function menuControls(i) {
  const dialog = document.querySelector("dialog[open]");
  if (mode === "playing" && !dialog) {
    menuDirection = "";
    return;
  }
  if (menuNeutral) {
    menuDirection = "";
    if (
      ["left", "right", "up", "down", "a", "b", "pause"].some(
        (k) => i.current[k],
      )
    )
      return;
    menuNeutral = false;
  }
  const targets = menuTargets();
  const direction =
    ["left", "right", "up", "down"].find((d) => i.current[d]) || "";
  const now = performance.now();
  if (direction && (direction !== menuDirection || now >= menuRepeatAt)) {
    navigateMenu(targets, direction);
    menuRepeatAt = now + (direction !== menuDirection ? 360 : 140);
  }
  menuDirection = direction;
  if (i.pressed.b) {
    if (dialog) dialog.close();
    else if (mode !== "home") home();
    else focusMenu($("[data-game]"));
  } else if (i.pressed.a || (i.pressed.pause && !dialog && mode === "intro")) {
    const focused = targets.includes(document.activeElement)
      ? document.activeElement
      : dialog
        ? dialog.querySelector("button")
        : mode === "home"
          ? $("[data-game]")
          : $("#overlay-action");
    focused?.click();
  }
}

function showResults() {
  const best = finishRecord(records, {
    id: selected.id,
    level: currentLevel,
    gentle: runGentle,
    team: !!game.buddy,
    time: game.t,
    score: game.score,
    moves: game.moves,
    combo: game.bestCombo,
  });
  const rows =
    selected.id === "garden"
      ? [
          ["Moves", game.moves],
          ["Fewest moves", best.bestMoves],
          ["Time", clockLabel(game.t)],
        ]
      : [
          ["Time", clockLabel(game.t)],
          ["Best time", clockLabel(best.bestTime)],
          ["Finishes", best.finishes],
        ];
  $("#overlay-results").innerHTML =
    `<div class="result-heading">${best.first ? "First finish!" : best.improved ? "A new personal best!" : "Another adventure together"}<small>${runGentle ? "Gentle" : "Classic"} · ${game.buddy ? "Family co-op" : "Solo"} · this device</small></div><dl>${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>`;
}
function frame(now) {
  const dt = Math.min((now - last) / 1000 || 0, 0.1);
  last = now;
  input.multiplayer = mode === "playing" && !!game?.buddy;
  input.poll();
  const pad = !!input.padName;
  if (pad !== wasPad) {
    if (wasPad && !pad && mode === "playing") {
      pause();
      toast("Controller disconnected. Your game is paused.");
    }
    wasPad = pad;
    $("#controller-status").textContent = pad
      ? "⌘ Controller connected"
      : "⌨ Keyboard ready";
    document.body.classList.toggle("controller-active", pad);
    if (
      pad &&
      mode === "home" &&
      !document.querySelector("dialog[open]") &&
      !menuTargets().includes(document.activeElement)
    )
      focusMenu($("[data-game]"));
  }
  if (!document.querySelector("dialog[open]")) {
    if (input.pressed.pause) pause();
    if (input.pressed.restart && mode !== "home")
      launch(selected.id, currentLevel);
  }
  menuControls(input);
  if (mode === "playing") {
    let remaining = dt,
      first = true;
    while (remaining > 0) {
      const step = Math.min(1 / 120, remaining);
      game.update(
        step,
        first
          ? input
          : {
              ...input,
              pressed: {},
              released: {},
              second: { ...input.second, pressed: {}, released: {} },
            },
      );
      first = false;
      remaining -= step;
      if (game.done || game.failed) break;
    }
    let newKeepsake = false;
    for (const secret of game.discoveries || [])
      if (secret.found && !keepsakes.has(secret.id)) {
        keepsakes.add(secret.id);
        newKeepsake = true;
      }
    if (newKeepsake) {
      save();
      renderAlbum();
    }
    if (!game.done && !game.failed) {
      sound.music(selected.id, game.t);
      if (selected.id === "rally") sound.motor(game.speed, game.boosting);
    } else sound.stopMotor();
    if ($("#game-score").textContent !== game.message)
      $("#game-score").textContent = game.message;
    const objective = game.objective || selected.objective;
    if ($("#game-objective").textContent !== objective)
      $("#game-objective").textContent = objective;
    const hint = game.noticeTime > 0 ? game.notice : game.hint;
    if ($("#game-hint").textContent !== hint)
      $("#game-hint").textContent = hint;
    if (game.done) {
      mode = "won";
      showResults();
      const levels = levelsFor(selected.id);
      if (levels.length) {
        const before = levelRecords[selected.id][currentLevel] || {};
        levelRecords[selected.id][currentLevel] = {
          completed: true,
          time: Math.min(before.time || Infinity, game.t),
          ...(Number.isFinite(game.moves)
            ? { moves: Math.min(before.moves ?? Infinity, game.moves) }
            : {}),
          collectibles: Math.max(before.collectibles || 0, game.score),
          retries: Math.min(before.retries ?? Infinity, game.deaths ?? 0),
        };
        if (Object.keys(levelRecords[selected.id]).length === levels.length)
          won.add(selected.id);
      } else won.add(selected.id);
      save();
      overlay(
        "A LITTLE VICTORY",
        `You did it, ${name}!`,
        levels.length
          ? `${game.levelInfo.title} complete! ${Object.keys(levelRecords[selected.id]).length} of ${levels.length} stages finished.${selected.id === "garden" ? ` ${game.moves} moves.` : ` ${game.score} bananas brought home.`}`
          : `${selected.title} complete. Another little memory for the collection.`,
        currentLevel < levels.length - 1 ? "Next stage →" : "Play again ↗",
      );
    } else if (game.failed) {
      mode = "lost";
      overlay(
        "EVERY TRY IS AN ADVENTURE",
        "One more little try?",
        "Take a breath, then hop back in. Gentle mode on the shelf gives you a little extra help.",
        "Try again ↗",
      );
    }
  }
  if (mode === "won") {
    game.celebrateStep(dt);
    drawVictoryParty(game.presentationTime);
  }
  if (mode !== "home" && game && painter) {
    game.draw(painter);
    painter.finish();
  }
  requestAnimationFrame(frame);
}
// Read-only diagnostics for smoke tests and bug reports; no game state mutation API.
window.arcade = {
  snapshot: () => ({
    mode,
    character,
    framebuffer: painter
      ? { width: painter.canvas.width, height: painter.canvas.height }
      : null,
    id: selected?.id,
    level: currentLevel,
    levelTitle: game?.levelInfo?.title,
    platforms: game?.platforms?.map((p) => ({ ...p })),
    springs: game?.springs?.map((p) => ({ ...p })),
    levelRecords: JSON.parse(JSON.stringify(levelRecords)),
    records: JSON.parse(JSON.stringify(records)),
    keepsakes: [...keepsakes],
    discoveries: game?.discoveries?.map((s) => ({
      id: s.id,
      x: s.x,
      y: s.y,
      found: s.found,
    })),
    shortcut: game?.shortcut,
    score: game?.score,
    time: game?.t,
    gentle: game?.gentle,
    companion: game?.bean
      ? {
          x: game.bean.x,
          y: game.bean.y,
          state: game.bean.state,
          animation: game.bean.actor.state,
          direction: game.bean.direction,
        }
      : null,
    message: game?.message,
    player: game?.player ? { ...game.player } : null,
    buddy: game?.buddy
      ? {
          hero: game.buddy.hero,
          player: { ...game.buddy.player },
          animation: game.buddy.actor.state,
        }
      : null,
    playfield: game
      ? {
          distance: game.distance,
          ball: game.ball ? { ...game.ball } : null,
          paddle: game.paddle ? { ...game.paddle } : null,
          launched: game.launched,
          targets: (game.bricks || game.enemies || [])
            .filter((e) => e.alive !== false)
            .map((e) => ({ x: e.x, y: e.y })),
        }
      : null,
    renderer: painter?.renderer.info.render,
    audio: {
      enabled: sound.enabled,
      voices: sound.voices.size + (sound.engineVoice ? 1 : 0),
      theme: sound.musicWorld || null,
    },
    artwork: { ...artStatus },
    characterArtwork: { ...characterArtStatus },
    creatureArtwork: { ...creatureArtStatus },
    objectArtwork: { ...objectArtStatus },
    animation: game?.actor
      ? {
          state: game.actor.state,
          time: game.actor.time,
          frame: game.actor.frame(character),
          renderedState: game.renderState(),
          renderedFrame: clipFrame(
            character,
            game.renderState(),
            game.actor.time,
          ),
        }
      : null,
    explored: [...explored],
    won: [...won],
  }),
};
$(".site-header .brand").onclick = (event) => {
  event.preventDefault();
  home();
};
cards();
observePixelArt();
requestAnimationFrame(frame);
