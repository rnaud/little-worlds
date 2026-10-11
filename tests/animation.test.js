import test from "node:test";
import assert from "node:assert/strict";
import {
  ActorAnimation,
  actorState,
  clipFrame,
  HUMAN_CLIPS,
  BEAN_CLIPS,
} from "../src/animation.js";
import { Platformer, Forest, Garden } from "../src/games.js";
import { gridRoute } from "../src/navigation.js";
import { overlap } from "../src/engine.js";
import { thumbDirections } from "../src/input-math.js";
import { THEMES, themeStep } from "../src/music.js";
import { Sound } from "../src/engine.js";
const input = (x = 0, y = 0, current = {}, pressed = {}) => ({
  x,
  y,
  current,
  pressed,
});
test("touch pad supports a neutral center, cardinal motion, diagonals and leaving the pad", () => {
  assert.deepEqual(thumbDirections(0, 0), []);
  assert.deepEqual(thumbDirections(0.8, 0), ["right"]);
  assert.deepEqual(thumbDirections(-0.8, -0.8), ["left", "up"]);
  assert.deepEqual(thumbDirections(0.8, 0.8), ["right", "down"]);
  assert.deepEqual(thumbDirections(2, 0), []);
});
test("seven original world themes are distinct and quiet", () => {
  assert.equal(Object.keys(THEMES).length, 7);
  assert.deepEqual(themeStep("unknown", 0), []);
  assert.equal(
    new Set(Object.values(THEMES).map((t) => t.notes.join(","))).size,
    7,
  );
  for (const id of Object.keys(THEMES))
    for (let n = 0; n < 64; n++)
      for (const event of themeStep(id, n)) {
        assert.ok(event.frequency > 20 && event.frequency < 2000);
        assert.ok(event.duration > 0.05 && event.duration < 2);
        assert.ok(event.level > 0 && event.level <= 0.02);
      }
});
test("music lookahead does not duplicate notes and resets on stop", () => {
  const run = (rate) => {
    const s = new Sound();
    s.enabled = true;
    const notes = [];
    s.play = (f, d, type, delay, level) => notes.push([f, d, type, level]);
    for (let n = 0; n < rate * 8; n++) s.music("garden", n / rate);
    return { s, notes };
  };
  const a = run(60),
    b = run(120);
  assert.deepEqual(a.notes, b.notes);
  a.s.stop();
  assert.equal(a.s.musicCursor, null);
  const before = a.notes.length;
  a.s.enabled = false;
  a.s.music("garden", 9);
  assert.equal(a.notes.length, before);
});
test("named clips only reference valid source frames and use positive timings", () => {
  for (const clips of [HUMAN_CLIPS, BEAN_CLIPS])
    for (const clip of Object.values(clips)) {
      assert.equal(clip.frames.length, clip.durations.length);
      assert.ok(
        clip.frames.every((n) => Number.isInteger(n) && n >= 0 && n < 37),
      );
      assert.ok(clip.durations.every((n) => n > 0));
    }
});
test("jump, fall, dash, action and celebration have explicit priority", () => {
  assert.equal(actorState({ ground: false, vy: -200, moving: true }), "jump");
  assert.equal(actorState({ ground: false, vy: 200 }), "fall");
  assert.equal(actorState({ ground: false, wall: true, vy: 85 }), "wall");
  assert.equal(actorState({ ground: false, wall: true, vy: -200 }), "jump");
  assert.equal(actorState({ ground: false, dash: true, vy: 200 }), "dash");
  assert.equal(actorState({ action: true, moving: true }), "action");
  assert.equal(actorState({ celebrate: true, dash: true }), "celebrate");
});
test("clip timing is deterministic across frame rates and one-shot clips hold", () => {
  const a = new ActorAnimation(),
    b = new ActorAnimation();
  for (let i = 0; i < 60; i++) a.update(1 / 60, { moving: true, speed: 250 });
  for (let i = 0; i < 120; i++) b.update(1 / 120, { moving: true, speed: 250 });
  assert.equal(a.frame("gaia"), b.frame("gaia"));
  assert.equal(clipFrame("gaia", "action", 100), 12);
  assert.notEqual(
    clipFrame("bean", "sniff", 0),
    clipFrame("bean", "sniff", 0.8),
  );
});
test("state changes restart clips and steady states keep advancing", () => {
  const a = new ActorAnimation();
  a.update(0.5, { moving: true });
  const t = a.time;
  a.update(0.1, { moving: true });
  assert.ok(a.time > t);
  a.update(0.01, { ground: false, vy: -1 });
  assert.equal(a.state, "jump");
  assert.ok(a.time < 0.02);
});
test("platform animations follow physics rather than held buttons", () => {
  const g = new Platformer("summit", true);
  for (let i = 0; i < 90; i++) g.update(1 / 120, input());
  assert.equal(g.actor.state, "idle");
  g.update(1 / 120, input(0, 0, {}, { a: true }));
  g.update(1 / 120, input());
  assert.equal(g.actor.state, "jump");
  g.update(1 / 120, input(1, 0, {}, { b: true }));
  g.update(1 / 120, input());
  assert.equal(g.actor.state, "dash");
});
test("garden movement and pushing animate without changing puzzle rules", () => {
  const g = new Garden(true, undefined, 4);
  assert.ok(g.move(1, 0));
  g.update(1 / 120, input());
  assert.equal(g.actor.state, "push");
  assert.equal(g.moves, 1);
  assert.ok(g.renderPlayer.x < g.player.x);
  g.undo();
  assert.equal(g.moves, 0);
});
test("forest wand triggers directional action", () => {
  const g = new Forest(true);
  g.update(0.01, input(0, 0, {}, { a: true }));
  g.update(0.01, input());
  assert.equal(g.actor.state, "action");
  assert.equal(g.renderState(), "actionDown");
  g.direction = "up";
  assert.equal(g.renderState(), "actionUp");
});
test("top-down walking and pushing choose front and back poses", () => {
  const g = new Forest(true);
  g.update(0.01, input(0, -1));
  g.update(0.01, input(0, -1));
  assert.equal(g.renderState(), "walkUp");
  for (let i = 0; i < 30; i++) g.update(0.01, input());
  assert.equal(g.renderState(), "idleUp");
  g.update(0.01, input(0, 1));
  g.update(0.01, input(0, 1));
  assert.equal(g.renderState(), "walkDown");
  const garden = new Garden(true);
  garden.direction = "up";
  garden.actionTime = 0.1;
  garden.update(0.01, input());
  assert.equal(garden.renderState(), "pushUp");
});
test("garden routing avoids pots and does not cut corners", () => {
  const blocked = new Set(["2,1", "2,2", "2,3"]);
  const path = gridRoute({ x: 1, y: 2 }, { x: 3, y: 2 }, blocked, 5, 5);
  assert.ok(path);
  for (let i = 1; i < path.length; i++) {
    assert.ok(!blocked.has(`${path[i].x},${path[i].y}`));
    assert.equal(
      Math.abs(path[i].x - path[i - 1].x) + Math.abs(path[i].y - path[i - 1].y),
      1,
    );
  }
  const g = new Garden(true),
    states = new Set();
  for (let i = 0; i < 1800; i++) {
    g.update(1 / 120, input());
    states.add(g.bean.state);
    for (const b of g.boxes)
      assert.ok(
        !overlap(
          { x: g.bean.x, y: g.bean.y, w: 18, h: 18 },
          { x: 264 + b.x * 54, y: 80 + b.y * 54, w: 48, h: 48 },
        ),
      );
  }
  assert.ok(states.has("exploring"));
  assert.ok(states.has("returning"));
});
