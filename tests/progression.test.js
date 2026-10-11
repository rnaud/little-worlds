import test from "node:test";
import assert from "node:assert/strict";
import { Garden, Platformer, Forest } from "../src/games.js";
import { GARDEN_LEVELS, MEADOW_LEVELS } from "../src/levels.js";
import { solveGarden } from "./level-solvers.js";
const idle = () => ({ x: 0, y: 0, current: {}, pressed: {}, released: {} });
const step = (g, seconds, input = idle()) => {
  for (let n = 0; n < seconds * 120; n++)
    g.update(1 / 120, n ? { ...input, pressed: {}, released: {} } : input);
};
test("all eight garden stages have legal solutions and the opening stages teach gradually", () => {
  const moves = [];
  for (let level = 0; level < GARDEN_LEVELS.length; level++) {
    const g = new Garden(true, undefined, level),
      route = solveGarden(g);
    for (const [dx, dy] of route)
      assert.ok(g.move(dx, dy), `${level}: legal move`);
    g.update(1 / 120, idle());
    assert.equal(g.done, true, `stage ${level}`);
    assert.equal(g.score, g.targets.length);
    moves.push(route.length);
  }
  assert.equal(moves[0], 2);
  assert.ok(moves[1] > moves[0]);
  assert.ok(moves[2] > moves[1]);
});
test("meadow stages use distinct authored geometry and safe checkpoints", () => {
  assert.equal(
    new Set(MEADOW_LEVELS.map((l) => JSON.stringify(l.platforms))).size,
    6,
  );
  for (let level = 0; level < 6; level++) {
    const g = new Platformer("meadow", false, undefined, level),
      [x, y] = g.levelInfo.checkpoint;
    assert.ok(
      g.platforms.some(
        (b) =>
          !b.moving && !b.crumble && Math.abs(b.x - x) < b.w / 2 && y < b.y,
      ),
    );
    g.items[0].got = true;
    g.score = 1;
    g.player.y = 700;
    g.update(1 / 120, idle());
    assert.equal(g.level, level);
    assert.equal(g.score, 1);
    assert.ok(g.items[0].got);
  }
});
test("flower springs launch from their visible top and protect the initial bounce from jump release", () => {
  const g = new Platformer("meadow", false, undefined, 2),
    spring = g.springs[0];
  Object.assign(g.player, {
    x: spring.x,
    y: spring.y - 54 / 2,
    ground: true,
    vy: 0,
  });
  g.update(1 / 120, idle());
  assert.ok(g.player.vy < -700);
  assert.equal(g.player.ground, false);
  assert.ok(g.player.y + 27 <= spring.y - 42);
  g.update(1 / 120, { ...idle(), released: { a: true } });
  assert.ok(g.player.vy < -600);
});
test("leaf ferry carries a resting hero and Bean with it", () => {
  const g = new Platformer("meadow", false, undefined, 3),
    index = 4,
    b = g.platforms[index];
  Object.assign(g.player, {
    x: b.x,
    y: b.y - b.h / 2 - 27,
    ground: true,
    vx: 0,
    vy: 0,
  });
  g.bean.platform = index;
  g.bean.x = b.x - 60;
  g.bean.landings = [];
  const start = g.player.x;
  step(g, 0.8);
  assert.ok(g.player.x > start + 30);
  assert.ok(Math.abs(g.player.x - b.x) < 2);
  assert.ok(g.player.ground);
  assert.ok(g.bean.x >= b.x - b.w / 2 - 10 && g.bean.x <= b.x + b.w / 2 + 10);
});
test("crumbling coral warns, disappears and returns without losing collectibles", () => {
  const g = new Platformer("meadow", false, undefined, 4),
    b = g.platforms[3];
  Object.assign(g.player, {
    x: b.x,
    y: b.y - b.h / 2 - 27,
    ground: true,
    vx: 0,
    vy: 0,
  });
  step(g, 0.1);
  assert.ok(b.shake > 0);
  assert.ok(!b.hidden);
  step(g, 1.2);
  assert.ok(b.hidden > 0);
  step(g, 3.2);
  assert.equal(b.hidden, 0);
});
test("family helper has independent physics and shared collectibles, with free recovery", () => {
  const g = new Platformer("meadow", false);
  g.setBuddy(true, "nur");
  step(g, 0.2);
  const lead = g.player.x,
    helper = g.buddy.player.x;
  const input = {
    ...idle(),
    second: { ...idle(), x: 1, current: { b: true } },
  };
  step(g, 0.2, input);
  assert.equal(g.player.x, lead);
  assert.ok(g.buddy.player.x > helper + 25);
  const item = g.items[0];
  Object.assign(g.buddy.player, { x: item.x, y: item.y, vx: 0, vy: 0 });
  g.update(1 / 120, idle());
  assert.equal(g.score, 1);
  assert.ok(item.got);
  g.buddy.player.y = 700;
  g.update(1 / 120, idle());
  assert.equal(g.deaths, 0);
  assert.ok(g.buddy.player.y < 500);
});
test("Bean reveals keepsakes only nearby and opens a real woodland shortcut after the gate", () => {
  const g = new Forest(true);
  g.hero = "bean";
  g.update(1 / 120, { ...idle(), pressed: { a: true } });
  assert.equal(g.discoveries.filter((s) => s.found).length, 0);
  for (const secret of [g.discoveries[0], g.discoveries[2]]) {
    Object.assign(g.player, { x: secret.x, y: secret.y });
    g.update(1 / 120, { ...idle(), pressed: { a: true } });
  }
  assert.equal(g.discoveries.filter((s) => s.found).length, 2);
  assert.equal(g.shortcut, false);
  g.open = true;
  g.update(1 / 120, idle());
  assert.equal(g.shortcut, true);
  assert.ok(
    !g.walls.some(
      (w) => Math.abs(w.x - 480) < w.w / 2 && Math.abs(w.y - 168) < w.h / 2,
    ),
  );
});

import { meadowDriver } from "./meadow-driver.js";
test("all six meadow stages can be completed with ordinary controls in both difficulties", () => {
  for (const gentle of [false, true])
    for (let level = 0; level < 6; level++) {
      const game = new Platformer("meadow", gentle, undefined, level),
        driver = meadowDriver(level);
      for (let tick = 0; tick < 120 * 30 && !game.done; tick++)
        game.update(1 / 120, driver.input(game));
      assert.equal(game.done, true, `${level}, gentle ${gentle}: complete`);
      assert.equal(game.deaths, 0, `${level}: fair route without retries`);
    }
});

import { summitDriver } from "./summit-driver.js";
test("all three summit stages teach jumps, dash crossings and cracked ice with safe checkpoints", () => {
  for (const gentle of [false, true])
    for (let level = 0; level < 3; level++) {
      const g = new Platformer("summit", gentle, undefined, level),
        driver = summitDriver(level);
      for (const point of g.checkpoints)
        assert.ok(
          g.platforms.some(
            (b) =>
              !b.crumble &&
              Math.abs(b.x - point.x) < b.w / 2 &&
              Math.abs(b.y - b.h / 2 - point.y - 27) < 1,
          ),
        );
      for (let tick = 0; tick < 120 * 40 && !g.done; tick++)
        g.update(1 / 120, driver.input(g));
      assert.ok(g.done, `stage ${level} gentle ${gentle}`);
      assert.equal(g.deaths, 0);
      assert.equal(g.score, 3);
    }
});

test("Meadows thin ledges allow jumping up and deliberate down-jump drops", () => {
  const g = new Platformer("meadow", false),
    b = g.platforms[5],
    top = b.y - b.h / 2;
  Object.assign(g.player, {
    x: b.x,
    y: top + 40,
    vy: -300,
    vx: 0,
    ground: false,
  });
  g.update(1 / 120, idle());
  assert.ok(g.player.vy < 0, "underside does not cancel the jump");
  Object.assign(g.player, { x: b.x, y: top - 27, vy: 0, ground: true });
  g.update(1 / 120, { ...idle(), y: 1, pressed: { a: true } });
  assert.equal(g.player.ground, false);
  assert.ok(g.player.vy > 0);
  step(g, 0.6);
  assert.ok(g.player.ground);
  assert.equal(g.player.y + 27, 438);
});
