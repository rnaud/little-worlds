import test from "node:test";
import assert from "node:assert/strict";
import { readRecords, finishRecord, clockLabel } from "../src/records.js";
test("personal records separate stages, difficulty and co-op and preserve best results", () => {
  const records = {},
    run = {
      id: "meadow",
      level: 0,
      gentle: true,
      team: false,
      time: 20,
      score: 5,
    };
  assert.equal(finishRecord(records, run).first, true);
  const best = finishRecord(records, { ...run, time: 15, score: 7 });
  assert.equal(best.finishes, 2);
  assert.equal(best.bestTime, 15);
  assert.equal(best.bestScore, 7);
  assert.equal(best.improved, true);
  const slower = finishRecord(records, { ...run, time: 25, score: 6 });
  assert.equal(slower.improved, false);
  assert.equal(slower.bestTime, 15);
  for (const change of [{ level: 1 }, { gentle: false }, { team: true }])
    assert.equal(finishRecord(records, { ...run, ...change }).first, true);
  assert.equal(Object.keys(records).length, 4);
});
test("garden rewards fewer moves rather than faster movement", () => {
  const records = {};
  finishRecord(records, { id: "garden", time: 10, moves: 9 });
  assert.equal(
    finishRecord(records, { id: "garden", time: 8, moves: 10 }).improved,
    false,
  );
  assert.equal(
    finishRecord(records, { id: "garden", time: 12, moves: 8 }).improved,
    true,
  );
});
test("record storage tolerates malformed values and JSON nulls; clocks round across a minute", () => {
  assert.deepEqual(readRecords(null), {});
  assert.deepEqual(readRecords({ garbage: {} }), {});
  const records = readRecords({
    "garden:0:gentle:solo": {
      finishes: -1,
      bestTime: null,
      bestMoves: null,
      bestScore: "bad",
    },
  });
  const next = finishRecord(records, {
    id: "garden",
    gentle: true,
    time: 4,
    moves: 2,
  });
  assert.equal(next.bestTime, 4);
  assert.equal(next.bestMoves, 2);
  assert.equal(next.finishes, 1);
  assert.equal(clockLabel(59.99), "1:00.0");
  assert.equal(clockLabel(9.43), "0:09.4");
});

test("bubble records reward rescue chains and score rather than only speed", () => {
  const records = {};
  finishRecord(records, { id: "bubbles", time: 20, score: 1000, combo: 3 });
  assert.equal(
    finishRecord(records, { id: "bubbles", time: 25, score: 1500, combo: 4 })
      .improved,
    true,
  );
  assert.equal(
    finishRecord(records, { id: "bubbles", time: 18, score: 800, combo: 2 })
      .improved,
    false,
  );
});
