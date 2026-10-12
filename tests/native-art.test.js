import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTOR_PALETTES,
  drawNativeActor,
  drawNativeKart,
} from "../src/native-actors.js";
import { drawNativeCreature } from "../src/native-creatures.js";
const ids = Object.keys(ACTOR_PALETTES);
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
