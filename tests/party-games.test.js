import test from "node:test";
import assert from "node:assert/strict";
import { BubbleRescue, SplashMaze, BUBBLE_ROOMS } from "../src/party-games.js";
const input = (x = 0, y = 0, current = {}, pressed = {}) => ({
  x,
  y,
  current,
  pressed,
});
const tick = (g, n, i = input()) => {
  for (let k = 0; k < n; k++) g.update(1 / 120, k ? { ...i, pressed: {} } : i);
};
const pathTo = (g, start, test) => {
  const q = [{ ...start, path: [] }],
    seen = new Set([`${start.x},${start.y}`]);
  for (let at = 0; at < q.length; at++) {
    const p = q[at];
    if (test(p)) return p.path;
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      const x = p.x + dx,
        y = p.y + dy,
        key = `${x},${y}`;
      if (!seen.has(key) && !g.blocked(x, y)) {
        seen.add(key);
        q.push({ x, y, path: [...p.path, [dx, dy]] });
      }
    }
  }
  return null;
};
const walk = (g, path) => {
  for (const [dx, dy] of path) {
    g.update(1 / 120, input());
    g.update(1 / 120, input(dx, dy));
  }
};
test("water balloons stop at stone and the first hedge, and chain into other balloons", () => {
  const g = new SplashMaze(false);
  g.balloons = [
    { x: 1, y: 1, fuse: 2 },
    { x: 2, y: 1, fuse: 2 },
  ];
  const splash = g.splashCells(g.balloons[0]);
  assert.ok(splash.some((c) => c.x === 3 && c.y === 1));
  assert.ok(!splash.some((c) => c.x === 4 && c.y === 1));
  assert.ok(!splash.some((c) => c.x === 0));
  g.pop(g.balloons[0]);
  assert.equal(g.balloons.length, 0);
  assert.equal(g.splashes.length, 2);
  assert.ok(!g.crates.has("3,1"));
});
test("all three splash gardens are completable in Classic without damage using movement and balloon inputs", () => {
  const g = new SplashMaze(false);
  let decisions = 0;
  while (!g.done && decisions++ < 180) {
    const dry = g.flowers.filter((f) => !f.wet);
    if (!dry.length) {
      const path = pathTo(
        g,
        g.cell,
        (p) => p.x === g.exit.x && p.y === g.exit.y,
      );
      assert.ok(path);
      walk(g, path);
      continue;
    }
    // Find an accessible placement that waters a flower or opens a frontier hedge,
    // and an escape route outside its cross before pressing remote pop.
    let choice = null;
    for (let y = 1; y < 8; y++)
      for (let x = 1; x < 12; x++) {
        if (g.blocked(x, y)) continue;
        const route = pathTo(g, g.cell, (p) => p.x === x && p.y === y);
        if (!route) continue;
        const cells = g.splashCells({ x, y }),
          wet = cells.filter((c) =>
            dry.some((f) => f.x === c.x && f.y === c.y),
          ).length;
        const clear = cells.filter((c) => g.crates.has(`${c.x},${c.y}`)).length;
        if (!wet && !clear) continue;
        const escape = pathTo(
          g,
          { x, y },
          (p) => !cells.some((c) => c.x === p.x && c.y === p.y),
        );
        if (!escape || escape.length > 4) continue;
        const value = wet * 100 + clear * 5 - route.length;
        if (!choice || value > choice.value) choice = { route, escape, value };
      }
    assert.ok(choice, `room ${g.room}: no useful safe placement`);
    walk(g, choice.route);
    g.update(1 / 120, input(0, 0, {}, { a: true }));
    walk(g, choice.escape);
    g.update(1 / 120, input(0, 0, {}, { b: true }));
    tick(g, 65);
    assert.equal(g.hearts, 3, `room ${g.room}: avoid the clearly marked cross`);
    assert.ok(!g.failed);
  }
  assert.ok(g.done);
  assert.equal(g.flowersWatered, 10);
  assert.ok(g.balloonCount >= 10);
});
test("bubble rooms have Classic-reachable terrace spacing and independent Bean movement", () => {
  for (const room of BUBBLE_ROOMS) {
    const heights = [
      ...new Set(room.platforms.map(([x, y, w, h]) => y - h / 2)),
    ].sort((a, b) => b - a);
    for (let i = 1; i < heights.length; i++)
      assert.ok(heights[i - 1] - heights[i] <= 96);
  }
  const g = new BubbleRescue(false);
  tick(g, 90);
  assert.ok(g.player.ground);
  const x = g.bean.x;
  tick(g, 600);
  assert.notEqual(g.bean.x, x);
  assert.ok(g.bean.actor);
});
test("Bean leaves an imminent water cross for a dry reachable cell without changing the puzzle", () => {
  const g = new SplashMaze(false);
  g.crates.clear();
  g.cell = { x: 3, y: 3 };
  Object.assign(g.player, { x: 318, y: 216 });
  Object.assign(g.bean, { x: 372, y: 216 });
  g.balloons = [{ x: 3, y: 3, fuse: 0.8 }];
  const danger = new Set(
    g.splashCells(g.balloons[0]).map((c) => `${c.x},${c.y}`),
  );
  const walls = [...g.walls].map((k) => {
    const [x, y] = k.split(",").map(Number);
    return { x: 156 + x * 54, y: 54 + y * 54, w: 51, h: 51 };
  });
  walls.push({ x: 318, y: 216, w: 51, h: 51 });
  for (let n = 0; n < 90; n++) g.stepBean(1 / 60, walls);
  const cell = `${Math.round((g.bean.x - 156) / 54)},${Math.round((g.bean.y - 54) / 54)}`;
  assert.ok(!danger.has(cell), `Bean reaches a dry cell, got ${cell}`);
  assert.equal(g.hearts, 3);
  assert.equal(g.score, 0);
  assert.equal(g.balloons.length, 1);
});
test("bubble traps can be rescued, expire safely, and reward a quick rescue chain", () => {
  const g = new BubbleRescue(false);
  tick(g, 30);
  const e = g.enemies[0];
  e.x = g.player.x + 65;
  e.y = g.player.y - 8;
  g.update(1 / 120, input(0, 0, { b: true }, { b: true }));
  tick(g, 40);
  assert.ok(e.trapped || !e.alive);
  if (e.alive) g.rescue(e);
  const other = g.enemies[1];
  other.trapped = true;
  g.rescue(other);
  assert.equal(g.combo, 2);
  assert.equal(g.bestCombo, 2);
  assert.ok(g.score >= 300);
  const timed = g.enemies[2];
  timed.trapped = true;
  timed.trapTime = 0.01;
  tick(g, 3);
  assert.equal(timed.trapped, false);
});

test("bubble helper has independent controls and bubbles while sharing the rescue score", () => {
  const g = new BubbleRescue(true);
  g.setBuddy(true, "nur");
  tick(g, 90);
  const lead = g.player.x,
    buddy = g.buddy.player.x;
  tick(g, 30, { ...input(), second: input(1, 0, { b: true }, { b: true }) });
  assert.equal(g.player.x, lead);
  assert.ok(g.buddy.player.x > buddy + 15);
  assert.ok(g.shots.length);
  assert.ok(g.buddy.actor.state === "action" || g.buddy.actor.state === "run");
  g.room++;
  g.loadRoom();
  assert.equal(g.buddy.hero, "nur");
  assert.ok(g.buddy.player.x > g.player.x);
});

test("all bubble rooms can be completed with input-only movement, jumping and blowing in both modes", async () => {
  const { bubblePilot } = await import("./bubble-pilot.js");
  for (const gentle of [true, false]) {
    const g = new BubbleRescue(gentle);
    for (let n = 0; n < 120 * 100 && !g.done && !g.failed; n++)
      g.update(1 / 120, bubblePilot(g));
    assert.ok(g.done, `${gentle ? "Gentle" : "Classic"} route finishes`);
    assert.equal(g.rescued, 18);
    assert.equal(g.room, 2);
    assert.ok(g.hearts > 0);
  }
});
