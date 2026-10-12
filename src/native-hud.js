import { PixelDrawing } from "./native-actors.js";
import { rallyPose } from "./rally-art.js";

// A tiny native-grid circuit, drawn independently from the projected road.
// Store horizontal pixel runs so the map uses a bounded number of primitives.
const rallyMapRuns = [];
for (let y = -12; y <= 12; y++) {
  let start = null;
  for (let x = -19; x <= 20; x++) {
    const radius = (x / 17) ** 2 + (y / 11) ** 2;
    const road = x < 20 && radius >= 0.8 && radius <= 1.15;
    if (road && start === null) start = x;
    if (!road && start !== null) {
      rallyMapRuns.push({ x: start, y, width: x - start });
      start = null;
    }
  }
}

export function rallyMapPoint(distance) {
  const pose = rallyPose(distance);
  return {
    x: Math.round(((pose.x - 1500) / 950) * 17),
    y: Math.round(((pose.y - 1500) / 650) * 11),
  };
}

function drawRallyMap(p, g) {
  const x = 294,
    y = 18;
  p.rect(x * 3, y * 3, 43 * 3, 31 * 3, "#253049");
  for (const run of rallyMapRuns)
    p.rect(
      (x + run.x + (run.width - 1) / 2) * 3,
      (y + run.y) * 3,
      run.width * 3,
      3,
      "#8795a8",
    );
  // Checkered start/finish is on the same east side as the Mode 7 circuit.
  for (let dy = -2; dy <= 2; dy++)
    p.rect((x + 17) * 3, (y + dy) * 3, 9, 3, dy % 2 ? "#151e32" : "#fff2d0");
  for (const [n, rival] of g.rivals.entries()) {
    const dot = rallyMapPoint(rival.distance);
    p.rect((x + dot.x) * 3, (y + dot.y) * 3, 3, 3, n ? "#94e5e1" : "#e998b3");
  }
  const dot = rallyMapPoint(g.distance);
  p.rect((x + dot.x) * 3, (y + dot.y) * 3, 9, 9, "#151e32");
  p.rect((x + dot.x) * 3, (y + dot.y) * 3, 3, 3, "#ffda87");
}

const ICONS = {
  heart: [
    ".oo.oo.",
    "ocwocco",
    "occccco",
    "occccco",
    ".occco.",
    "..oco..",
    "...o...",
  ],
  star: [
    "...o...",
    "..owo..",
    "ooocooo",
    ".occco.",
    "..ccc..",
    ".ococo.",
    ".oo.oo.",
  ],
  banana: [
    "....oo.",
    "....co.",
    "...wco.",
    "..wwco.",
    "owwco..",
    ".cco...",
    "..o....",
  ],
  lantern: [
    "..ooo..",
    "..o.o..",
    ".ooooo.",
    ".ocwco.",
    ".occco.",
    ".ocwco.",
    ".ooooo.",
  ],
  key: [
    ".ooo...",
    "ocwco..",
    "ococo..",
    ".oco...",
    "..oco..",
    "...ocoo",
    "....oco",
  ],
  flower: [
    "..oco..",
    ".ocwco.",
    "ocwwwco",
    ".ocwco.",
    "..oco..",
    ".o.c.o.",
    "..oco..",
  ],
  bubble: [
    "..ooo..",
    ".ocwco.",
    "oc...co",
    "ow...co",
    "oc...co",
    ".occco.",
    "..ooo..",
  ],
  ball: [
    "..ooo..",
    ".ocwco.",
    "ocwccco",
    "occccco",
    "occccco",
    ".occco.",
    "..ooo..",
  ],
  shield: [
    "ooooooo",
    "ocwccco",
    "ocwccco",
    "occccco",
    ".occco.",
    "..oco..",
    "...o...",
  ],
  catch: [
    "..ooo..",
    "..owo..",
    "..ooo..",
    ".......",
    "owcccwo",
    "occccco",
    ".ooooo.",
  ],
  bolt: [
    "...ocoo",
    "..ocoo.",
    ".ocoo..",
    "occccco",
    "..ooco.",
    ".ooco..",
    ".oco...",
  ],
  flag: [
    "ocwcwco",
    "owcwcwo",
    "ocwcwco",
    "owcwcwo",
    "oo.....",
    "oo.....",
    "oo.....",
  ],
};

export function drawHudIcon(id, active = true, color = "#ffda87") {
  const d = new PixelDrawing(7, 7, {
    o: "#151e32",
    c: active ? color : "#44546a",
    w: active ? "#fff2d0" : "#718094",
  });
  d.stamp(ICONS[id] || ICONS.star, 0, 0);
  return d;
}

// Semantic status is separate from its drawing so tests can check the same
// counters that a child sees, while the DOM still provides full text labels.
export function hudStatus(id, g) {
  const left = [],
    right = [];
  const icons = (target, icon, count, filled, color) => {
    for (let n = 0; n < count; n++)
      target.push({ icon, active: n < filled, color });
  };
  if (id === "summit" || id === "meadow")
    icons(
      left,
      id === "summit" ? "star" : "banana",
      g.need,
      g.score,
      "#ffda87",
    );
  if (id === "forest") {
    icons(left, "key", 1, g.key ? 1 : 0, "#ffda87");
    icons(left, "lantern", 3, g.score, "#ffbb77");
  }
  if (id === "garden")
    icons(left, "flower", g.targets.length, g.score, "#e998b3");
  if (id === "bubbles")
    icons(
      left,
      "bubble",
      g.enemies.length,
      g.enemies.filter((e) => !e.alive).length,
      "#94e5e1",
    );
  if (id === "splash")
    icons(
      left,
      "flower",
      g.flowers.length,
      g.flowers.filter((f) => f.wet).length,
      "#e998b3",
    );
  if (id === "space")
    icons(left, "star", 4, g.done ? 4 : g.finale ? 3 : g.wave - 1, "#ffda87");
  if (!g.gentle) {
    if (id === "forest" || id === "space")
      icons(right, "heart", 5, g.health, "#ec849c");
    if (id === "bubbles" || id === "splash")
      icons(right, "heart", 3, g.hearts, "#ec849c");
    if (id === "bricks") icons(right, "ball", 5, g.lives, "#a3dedd");
  }
  const meter =
    id === "rally"
      ? { icon: "bolt", fill: g.fuel, active: !g.boostLocked, color: "#ffda87" }
      : id === "space"
        ? {
            icon: "shield",
            fill: g.shield,
            active: !g.shieldLocked,
            color: "#94e5e1",
          }
        : id === "bricks"
          ? {
              icon: "catch",
              fill:
                g.catchTime > 0
                  ? g.catchTime / 1.25
                  : g.catchCooldown > 0
                    ? 1 - g.catchCooldown / 2.2
                    : 1,
              active: g.catchTime > 0 || g.catchCooldown <= 0,
              color: g.catchTime > 0 ? "#94e5e1" : "#ffda87",
            }
          : null;
  return { left, right, meter };
}

export function drawHud(p, id, g) {
  if (id === "rally") drawRallyMap(p, g);
  const status = hudStatus(id, g);
  const row = (entries, x) => {
    if (!entries.length) return;
    p.rect(
      x + (entries.length - 1) * 15,
      21,
      entries.length * 30 + 9,
      33,
      "#253049",
    );
    entries.forEach((e, n) =>
      p.hudIcon(e.icon, x + n * 30, 21, e.active, e.color),
    );
  };
  row(status.left, 27);
  row(status.right, 933 - (status.right.length - 1) * 30);
  if (status.meter) {
    const m = status.meter,
      x = 27 + status.left.length * 30;
    p.rect(x + 45, 21, 120, 33, "#253049");
    p.hudIcon(m.icon, x, 21, m.active, m.color);
    for (let n = 0; n < 8; n++)
      p.rect(
        x + 21 + n * 9,
        21,
        6,
        15,
        n / 8 < m.fill ? (m.active ? m.color : "#8795a8") : "#44546a",
      );
  }
}
