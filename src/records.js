const number = (value, fallback = 0) =>
  Number.isFinite(value) && value >= 0 ? value : fallback;
export function readRecords(saved) {
  const records = {};
  if (!saved || typeof saved !== "object") return records;
  for (const [key, entry] of Object.entries(saved)) {
    if (
      !/^(summit|meadow|forest|rally|bricks|garden|space|bubbles|splash):\d+:(gentle|classic):(solo|team)$/.test(
        key,
      ) ||
      !entry ||
      typeof entry !== "object"
    )
      continue;
    records[key] = {
      finishes: Math.floor(number(entry.finishes)),
      bestTime: number(entry.bestTime, Infinity),
      bestScore: number(entry.bestScore),
      bestMoves: number(entry.bestMoves, Infinity),
      bestCombo: number(entry.bestCombo),
    };
  }
  return records;
}
export function finishRecord(records, run) {
  const key = `${run.id}:${run.level || 0}:${run.gentle ? "gentle" : "classic"}:${run.team ? "team" : "solo"}`;
  const old = records[key] || {
    finishes: 0,
    bestTime: Infinity,
    bestScore: 0,
    bestMoves: Infinity,
    bestCombo: 0,
  };
  const entry = {
    finishes: old.finishes + 1,
    bestTime: Math.min(old.bestTime, number(run.time, Infinity)),
    bestScore: Math.max(old.bestScore, number(run.score)),
    bestMoves: Math.min(old.bestMoves, number(run.moves, Infinity)),
    bestCombo: Math.max(old.bestCombo, number(run.combo)),
  };
  records[key] = entry;
  const improved =
    old.finishes > 0 &&
    (run.id === "garden"
      ? entry.bestMoves < old.bestMoves
      : entry.bestTime < old.bestTime - 0.05);
  return { ...entry, first: !old.finishes, improved };
}
export function clockLabel(seconds) {
  const tenths = Math.round(number(seconds) * 10);
  return `${Math.floor(tenths / 600)}:${String(Math.floor(tenths / 10) % 60).padStart(2, "0")}.${tenths % 10}`;
}
