import { rallyPose, rallyRoad, projectRallyActor } from "../src/rally-art.js";
import { summitDriver } from "./summit-driver.js";
import { overlap } from "../src/engine.js";
import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  Platformer,
  Forest,
  Rally,
  Bricks,
  Garden,
  Space,
} from "../src/games.js";
import { games } from "../src/catalog.js";
const dt = 1 / 120;
const input = (x = 0, y = 0, current = {}, pressed = {}) => ({
  x,
  y,
  current,
  pressed,
});
const step = (g, n, i = input()) => {
  for (let k = 0; k < n; k++) g.update(dt, k ? { ...i, pressed: {} } : i);
};
test("nine distinct games stay finite under 10 seconds of input", () => {
  assert.equal(games.length, 9);
  for (const meta of games) {
    const g = createGame(meta.id, true);
    for (let k = 0; k < 1200; k++) {
      g.update(
        dt,
        input(
          k % 200 < 100 ? 1 : -1,
          k % 300 < 150 ? 1 : -1,
          { a: true },
          { a: k % 90 === 0, b: k % 120 === 0 },
        ),
      );
    }
    assert.ok(Number.isFinite(g.t), meta.id);
    if (g.player) {
      assert.ok(Number.isFinite(g.player.x), meta.id);
      assert.ok(Number.isFinite(g.player.y), meta.id);
    }
  }
});
test("platformer jump, air dash, landing refill and fall recovery", () => {
  const g = new Platformer("summit", false);
  step(g, 40);
  assert.ok(g.player.ground);
  const y = g.player.y;
  g.update(dt, input(0, 0, {}, { a: true }));
  assert.ok(g.player.vy < 0);
  step(g, 10);
  assert.ok(g.player.y < y);
  g.update(dt, input(1, 0, { b: true }, { b: true }));
  assert.equal(g.player.dash, 0);
  assert.ok(g.player.vx > 600);
  g.player.x = 100;
  g.player.y = 300;
  g.player.vx = 0;
  g.player.vy = 0;
  g.dashTime = 0;
  step(g, 100);
  assert.equal(g.player.dash, 1);
  g.player.y = 700;
  step(g, 1);
  assert.equal(g.deaths, 1);
  assert.equal(g.player.x, g.checkpoint.x);
});
test("summit full authored route is traversable in classic mode", () => {
  const g = new Platformer("summit", false);
  const driver = summitDriver();
  for (let frame = 0; frame < 18000 && !g.done; frame++)
    g.update(dt, driver.input(g));
  assert.equal(g.deaths, 0);
  assert.equal(g.score, 3);
  assert.equal(g.done, true);
});
test("meadow finish guidance points home once enough bananas are collected", () => {
  const g = new Platformer("meadow", false),
    markers = [];
  g.score = 6;
  step(g, 1);
  const painter = new Proxy(
    { hero: "gaia", marker: (x, y) => markers.push({ x, y }) },
    { get: (target, key) => (key in target ? target[key] : () => {}) },
  );
  g.draw(painter);
  assert.deepEqual(markers, [{ x: 925, y: g.flag.y - 42 }]);
  assert.match(g.message, /5 \/ 5 bananas · \+1 extra/);
  assert.match(g.hint, /cottage/);
});
test("forest key unlocks gate, lantern quest completes only at shrine", () => {
  const g = new Forest(true);
  g.player.x = 440;
  g.player.y = 307;
  step(g, 40, input(1));
  assert.ok(g.player.x < 460);
  g.player.x = 120;
  g.player.y = 130;
  step(g, 1);
  assert.ok(g.key);
  g.player.x = 440;
  g.player.y = 307;
  step(g, 1);
  assert.ok(g.open);
  for (const l of g.lanterns) {
    g.player.x = l.x;
    g.player.y = l.y;
    step(g, 1);
  }
  assert.equal(g.score, 3);
  assert.equal(g.done, false);
  Object.assign(g.player, g.shrine);
  step(g, 1);
  assert.ok(g.done);
});
test("rally reaches finish with normal driving", () => {
  const g = new Rally(true);
  for (let k = 0; k < 10000 && !g.done; k++) {
    const delta = g.road(424) - g.player.x;
    g.update(dt, input(Math.abs(delta) < 3 ? 0 : Math.sign(delta)));
  }
  assert.ok(g.done);
  assert.ok(g.distance >= 1800);
});
test("an exhausted boost recharges without pulsing and braking never spends boost", () => {
  const g = new Rally(false);
  g.countdown = 0;
  g.fuel = 0.001;
  g.update(dt, input(0, 0, { a: true }));
  assert.equal(g.boostLocked, true);
  for (let k = 0; k < 240; k++) {
    g.update(dt, input(0, 0, { a: true }));
    assert.equal(g.boosting, false, "holding an empty boost must not stutter");
  }
  assert.ok(g.fuel >= 0.2);
  g.update(dt, input());
  assert.equal(g.boostLocked, false);
  g.update(dt, input(0, 0, { a: true }));
  assert.equal(g.boosting, true);
  const beforeBrake = g.fuel;
  g.update(dt, input(0, 0, { a: true, b: true }));
  assert.equal(g.boosting, false);
  assert.ok(g.fuel >= beforeBrake);
});
test("brick impacts remove one brick and launch/paddle bounce work", () => {
  const g = new Bricks(false);
  g.update(dt, input(0, 0, {}, { a: true }));
  assert.ok(g.launched);
  const r = g.bricks[16];
  Object.assign(g.ball, { x: r.x, y: r.y + 18, vx: 0, vy: -250 });
  step(g, 3);
  assert.equal(g.score, 1);
  assert.equal(r.alive, false);
  Object.assign(g.ball, { x: g.paddle.x, y: 452, vx: 0, vy: 250 });
  step(g, 6);
  assert.ok(g.ball.vy < 0);
  g.ball.y = 600;
  step(g, 1);
  assert.equal(g.lives, 4);
  assert.equal(g.launched, false);
});
test("all three brick boards can be cleared with paddle aiming in both modes", () => {
  for (const gentle of [false, true])
    for (let level = 0; level < 3; level++) {
      const g = new Bricks(gentle, undefined, level);
      for (let n = 0; n < 120 * 90 && !g.done && !g.failed; n++) {
        const b = g.ball,
          target = g.bricks
            .filter((r) => r.alive)
            .sort((a, c) => Math.abs(a.x - b.x) - Math.abs(c.x - b.x))[0];
        const offset = target
          ? Math.max(
              -g.paddle.w * 0.32,
              Math.min(g.paddle.w * 0.32, (target.x - b.x) * -0.15),
            )
          : 0;
        const delta = b.x + offset - g.paddle.x;
        g.update(
          dt,
          input(
            Math.abs(delta) < 3 ? 0 : Math.sign(delta),
            0,
            {},
            { a: !g.launched },
          ),
        );
      }
      assert.equal(g.score, 24);
      assert.ok(g.done);
      assert.equal(g.lives, 5);
    }
});
test("garden puzzle has a complete solution through legal pushes", () => {
  const g = new Garden(true, undefined, 4);
  const stateKey = (p, b) =>
    `${p.x},${p.y}|${b
      .map((q) => `${q.x},${q.y}`)
      .sort()
      .join(";")}`;
  const queue = [
      { p: { ...g.player }, b: g.boxes.map((b) => ({ ...b })), route: [] },
    ],
    seen = new Set([stateKey(g.player, g.boxes)]),
    dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
  let solution;
  for (let at = 0; at < queue.length; at++) {
    const s = queue[at];
    if (g.targets.every((t) => s.b.some((b) => b.x === t.x && b.y === t.y))) {
      solution = s.route;
      break;
    }
    for (const [dx, dy] of dirs) {
      const p = { x: s.p.x + dx, y: s.p.y + dy },
        b = s.b.map((q) => ({ ...q }));
      if (g.walls.has(`${p.x},${p.y}`)) continue;
      const box = b.find((q) => q.x === p.x && q.y === p.y);
      if (box) {
        if (
          g.walls.has(`${box.x + dx},${box.y + dy}`) ||
          b.some((q) => q.x === box.x + dx && q.y === box.y + dy)
        )
          continue;
        box.x += dx;
        box.y += dy;
        if (box.x === 1 || box.x === 7 || box.y === 1 || box.y === 6) continue;
      }
      const key = stateKey(p, b);
      if (!seen.has(key)) {
        seen.add(key);
        queue.push({ p, b, route: [...s.route, [dx, dy]] });
      }
    }
    assert.ok(queue.length < 500000, "bounded solver");
  }
  assert.ok(solution);
  for (const [dx, dy] of solution) assert.ok(g.move(dx, dy));
  step(g, 1);
  assert.ok(g.done);
  assert.equal(g.score, 3);
  g.undo();
  assert.equal(g.moves, solution.length - 1);
  g.reset();
  assert.equal(g.moves, 0);
  assert.equal(g.done, false);
});
test("space shooter can clear all waves by aiming and firing", () => {
  const g = new Space(true);
  for (let k = 0; k < 24000 && !g.done; k++) {
    const target = g.enemies[0],
      delta = (target?.y || g.player.y) - g.player.y;
    g.update(
      dt,
      input(0, Math.abs(delta) < 3 ? 0 : Math.sign(delta), { a: true }),
    );
  }
  assert.ok(g.done);
  assert.equal(g.wave, 3);
  assert.equal(g.score, 19);
  assert.equal(g.finale, true);
});

test("Bean follows landings, explores ahead and returns independently", () => {
  const g = new Platformer("summit", true);
  step(g, 45);
  const y = g.bean.y;
  g.update(dt, input(0, 0, { a: true }, { a: true }));
  step(g, 18, input(0, 0, { a: true }));
  assert.equal(g.bean.y, y, "Bean does not mirror Gaia's jump");
  const platform = g.platforms[1];
  Object.assign(g.player, {
    x: platform.x,
    y: platform.y - platform.h / 2 - 19,
    vy: 0,
    vx: 0,
    ground: true,
  });
  step(g, 240);
  assert.equal(g.bean.platform, 1, "Bean bounds to the next safe landing");
  assert.equal(g.bean.leap, null);
  const positions = [];
  for (let k = 0; k < 1200; k++) {
    g.update(dt, input());
    positions.push(g.bean.x);
  }
  assert.ok(
    Math.max(...positions) - Math.min(...positions) > 25,
    "Bean explores and comes back while Gaia rests",
  );
});
test("every game has an independently moving Bean companion", () => {
  for (const meta of games) {
    const g = createGame(meta.id, true);
    step(g, 1);
    assert.ok(g.bean, meta.id);
    const initial = { x: g.bean.x, y: g.bean.y };
    const states = new Set();
    for (let k = 0; k < 1100; k++) {
      g.update(dt, input());
      states.add(g.bean.state);
    }
    assert.ok(Number.isFinite(g.bean.x) && Number.isFinite(g.bean.y), meta.id);
    assert.ok(states.has("exploring"), meta.id + " explores");
    assert.ok(
      states.has("returning") || states.has("following"),
      meta.id + " returns",
    );
    assert.ok(
      Math.hypot(initial.x - g.bean.x, initial.y - g.bean.y) > 1,
      meta.id + " moves",
    );
  }
});
test("Bean follows the woodland route without crossing the gate or hedges", () => {
  const g = new Forest(true);
  const waypoints = [
    [110, 300],
    [400, 300],
    [400, 140],
    [345, 140],
    [345, 300],
    [110, 300],
  ];
  for (const [x, y] of waypoints) {
    for (let k = 0; k < 1400; k++) {
      const dx = x - g.player.x,
        dy = y - g.player.y;
      if (Math.hypot(dx, dy) < 4) break;
      g.update(
        dt,
        input(
          Math.abs(dx) > 3 ? Math.sign(dx) : 0,
          Math.abs(dy) > 3 ? Math.sign(dy) : 0,
        ),
      );
      for (const wall of [...g.walls, g.gate])
        assert.ok(!overlap({ x: g.bean.x, y: g.bean.y, w: 18, h: 18 }, wall));
    }
  }
  assert.ok(g.bean.x > 50);
  assert.notEqual(g.bean.y, g.player.y + 13);
});
test("short jump release lowers the apex while a held jump clears the ledge", () => {
  const tap = new Platformer("summit", false),
    hold = new Platformer("summit", false);
  step(tap, 45);
  step(hold, 45);
  for (const g of [tap, hold])
    g.update(dt, input(0, 0, { a: true }, { a: true }));
  tap.update(dt, { ...input(), released: { a: true } });
  let tapY = tap.player.y,
    holdY = hold.player.y;
  for (let k = 0; k < 100; k++) {
    tap.update(dt, input());
    hold.update(dt, input(0, 0, { a: true }));
    tapY = Math.min(tapY, tap.player.y);
    holdY = Math.min(holdY, hold.player.y);
  }
  assert.ok(holdY < tapY - 50);
});
test("forest wand cannot defeat enemies through a closed gate", () => {
  const g = new Forest(false);
  g.player.x = 451;
  g.player.y = 307;
  g.enemies = [{ x: 501, y: 307, base: 501, alive: true }];
  g.t = (2 * Math.PI * 80 - 501) / 1.5 - dt;
  g.update(dt, input(0, 0, {}, { a: true }));
  assert.ok(Math.abs(g.enemies[0].x - g.player.x) < 70);
  assert.equal(g.enemies[0].alive, true);
  g.open = true;
  g.cool = 0;
  g.update(dt, input(0, 0, {}, { a: true }));
  assert.equal(g.enemies[0].alive, false);
  g.score = 3;
  g.update(dt, input());
  assert.match(g.objective, /Return/);
});
test("rally obstacles stay in their road lane; drag is frame-rate independent", () => {
  const a = new Rally(false),
    b = new Rally(false);
  for (const g of [a, b]) {
    g.countdown = 0;
    g.speed = 240;
    g.player.x = 190;
    g.spawn = 10;
    g.objects = [{ x: 0, y: 10, w: 30, h: 20, laneOffset: 80 }];
  }
  for (let k = 0; k < 120; k++) a.update(1 / 120, input());
  for (let k = 0; k < 60; k++) b.update(1 / 60, input());
  assert.ok(Math.abs(a.objects[0].x - a.road(a.objects[0].y) - 80) < 0.001);
  assert.ok(Math.abs(a.distance - b.distance) < 2);
});
test("paddle center rebound has lateral motion and separates from bricks", () => {
  const g = new Bricks(false);
  g.launched = true;
  Object.assign(g.ball, { x: g.paddle.x, y: 458, vx: 0, vy: 260 });
  g.update(dt, input());
  assert.ok(Math.abs(g.ball.vx) >= 65);
  assert.ok(g.ball.vy < 0);
  const r = g.bricks[16];
  Object.assign(g.ball, { x: r.x, y: r.y + 18, vx: 0, vy: -250 });
  g.update(dt, input());
  assert.ok(g.ball.y >= r.y + r.h / 2 + 8);
  assert.ok(g.ball.vy > 0);
});
test("garden requires a hold to reset and warns about trapped pots", () => {
  const g = new Garden(true);
  g.move(-1, 0);
  const moves = g.moves;
  g.update(dt, input(0, 0, { b: true }, { b: true }));
  g.update(dt, input());
  assert.equal(g.moves, moves);
  step(g, 100, input(0, 0, { b: true }));
  assert.equal(g.moves, 0);
  g.boxes[0] = { x: 1, y: 1 };
  g.update(dt, input());
  assert.equal(g.deadlock, true);
  assert.match(g.hint, /undo/);
});
test("space diagonal travel is normalized and shield turns off on release", () => {
  const a = new Space(false),
    b = new Space(false);
  a.update(0.1, input(1, 0));
  b.update(0.1, input(1, 1));
  assert.ok(
    Math.abs(
      a.player.x - 150 - Math.hypot(b.player.x - 150, b.player.y - 285),
    ) < 0.001,
  );
  a.update(dt, input(0, 0, { b: true }));
  assert.equal(a.shieldActive, true);
  a.update(dt, input());
  assert.equal(a.shieldActive, false);
  a.enemies = [];
  a.bullets = [{ x: 400, y: 300, vx: -160, friend: false }];
  a.update(dt, input());
  assert.equal(a.intermission, 1);
  assert.equal(a.bullets.length, 0);
  step(a, 125);
  assert.equal(a.wave, 2);
});

test("Mode 7 actors share the collision plane throughout the closed circuit", () => {
  for (let distance = 0; distance <= 1800; distance += 75) {
    for (const lane of [-140, 0, 140]) {
      const x = rallyRoad(distance, 424) + lane;
      const kart = projectRallyActor(distance, lane, x, 424);
      assert.ok(Math.abs(kart.depth - 140) < 1e-8);
      assert.ok(Math.abs(kart.y - 444) < 1e-8);
      assert.ok(Math.abs(kart.x - (480 + lane * 1.2)) < 1e-8);
      const ahead = projectRallyActor(
        distance,
        lane,
        rallyRoad(distance, 200) + lane,
        200,
      );
      assert.ok(
        ahead.depth > kart.depth,
        "upcoming objects recede toward the horizon",
      );
      assert.ok(ahead.y < kart.y);
      assert.ok(ahead.scale < kart.scale);
    }
  }
  const start = rallyPose(0),
    finish = rallyPose(1800);
  assert.ok(Math.hypot(start.x - finish.x, start.y - finish.y) < 1e-8);
});

test("brick catch has a timed window, relaunches cleanly, and misses after expiry", () => {
  const g = new Bricks(false);
  g.update(dt, input(0, 0, {}, { a: true }));
  assert.ok(g.launched);
  Object.assign(g.ball, { x: g.paddle.x, y: g.paddle.y - 17, vy: 250, vx: 0 });
  g.update(dt, input(0, 0, {}, { a: true }));
  assert.equal(g.launched, false);
  assert.equal(g.ball.x, g.paddle.x);
  assert.equal(g.lives, 5);
  assert.match(g.notice, /Caught/);
  g.update(dt, input(0, 0, {}, { a: true }));
  assert.equal(g.launched, true);
  assert.ok(g.ball.vy < 0);
  g.update(dt, input(0, 0, {}, { a: true }));
  step(g, 151);
  assert.equal(g.catchTime, 0);
  Object.assign(g.ball, { x: g.paddle.x, y: g.paddle.y - 17, vy: 250, vx: 0 });
  g.update(dt, input());
  assert.equal(g.launched, true, "late bounce must not catch");
  assert.ok(g.ball.vy < 0);
});

test("space shield returns a hostile star and the Keeper finale is reachable in Classic", () => {
  const g = new Space(false);
  g.bullets.push({
    x: g.player.x + 40,
    y: g.player.y,
    vx: -200,
    vy: 10,
    friend: false,
  });
  g.update(dt, input(0, 0, { b: true }));
  assert.equal(g.reflected, 1);
  assert.ok(
    g.bullets.some((b) => b.reflected && b.friend && b.vx > 0 && b.vy === 0),
  );
  for (let n = 0; n < 120 * 120 && !g.done && !g.failed; n++) {
    const delta = (g.enemies[0]?.y || g.player.y) - g.player.y;
    const threat = g.bullets.some(
      (b) =>
        !b.friend &&
        b.x > g.player.x &&
        b.x < g.player.x + 230 &&
        Math.abs(b.y - g.player.y) < 75,
    );
    g.update(
      dt,
      input(0, Math.abs(delta) < 3 ? 0 : Math.sign(delta), {
        a: true,
        b: threat,
      }),
    );
  }
  assert.equal(g.done, true);
  assert.equal(g.finale, true);
  assert.equal(g.score, 19);
  assert.ok(g.health > 0);
});
