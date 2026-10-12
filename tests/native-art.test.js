import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTOR_PALETTES,
  drawNativeActor,
  drawNativeKart,
} from "../src/native-actors.js";
import { drawNativeCreature } from "../src/native-creatures.js";
import { hudStatus, rallyMapPoint } from "../src/native-hud.js";
const ids = Object.keys(ACTOR_PALETTES);
test("rally map follows the projected circuit and closes at the finish", () => {
  assert.deepEqual(rallyMapPoint(0), { x: 17, y: 0 });
  assert.deepEqual(rallyMapPoint(450), { x: 0, y: 11 });
  assert.deepEqual(rallyMapPoint(900), { x: -17, y: 0 });
  assert.equal(Math.abs(rallyMapPoint(1350).x), 0);
  assert.equal(rallyMapPoint(1350).y, -11);
  assert.equal(rallyMapPoint(1800).x, 17);
  assert.equal(Math.abs(rallyMapPoint(1800).y), 0);
  for (let distance = 0; distance <= 1800; distance++) {
    const { x, y } = rallyMapPoint(distance);
    assert.ok(Number.isInteger(x) && Number.isInteger(y));
    assert.ok(Math.abs(x) <= 17 && Math.abs(y) <= 11);
  }
});
test("visual counters cap bonus pickups, hide finite hearts in Gentle and distinguish recharge from ready", () => {
  const meadow = hudStatus("meadow", { need: 5, score: 8, gentle: true });
  assert.equal(meadow.left.length, 5);
  assert.ok(meadow.left.every((i) => i.active));
  const classic = hudStatus("space", {
    wave: 2,
    finale: false,
    done: false,
    health: 3,
    shield: 0.2,
    shieldLocked: true,
    gentle: false,
  });
  assert.equal(classic.left.filter((i) => i.active).length, 1);
  assert.equal(classic.right.filter((i) => i.active).length, 3);
  assert.equal(classic.meter.active, false);
  assert.equal(
    hudStatus("space", { wave: 3, health: 5, shield: 1, gentle: true }).right
      .length,
    0,
  );
});
test("every native actor size has 37 authored poses, at most 15 colors, and binary alpha", () => {
  for (const small of [false, true])
    for (const id of ids) {
      const hashes = new Set();
      for (let f = 0; f < 37; f++) {
        const d = drawNativeActor(id, f, small),
          rgba = d.rgba();
        hashes.add(d.pixels.join(""));
        assert.ok(d.width <= 32 && d.height <= 32);
        assert.ok(new Set(d.pixels.filter((p) => p !== ".")).size <= 15);
        for (let i = 3; i < rgba.length; i += 4)
          assert.ok(rgba[i] === 0 || rgba[i] === 255);
        assert.ok(d.pixels.filter((p) => p !== ".").length > 50);
      }
      assert.equal(
        hashes.size,
        37,
        `${id} ${small ? "small" : "normal"} unique poses`,
      );
    }
});
test("each kart and creature has four distinct pixel-authored silhouettes or poses", () => {
  for (const small of [false, true]) {
    for (const id of ids)
      assert.equal(
        new Set(
          [0, 1, 2, 3].map((f) => drawNativeKart(id, f, small).pixels.join("")),
        ).size,
        4,
      );
    for (const id of [
      "leaf-slime",
      "fern-spirit",
      "winged-unicorn",
      "crystal-rock",
      "moon-keeper",
    ])
      assert.equal(
        new Set(
          [0, 1, 2, 3].map((f) =>
            drawNativeCreature(id, f, small).pixels.join(""),
          ),
        ).size,
        4,
        id,
      );
  }
});
