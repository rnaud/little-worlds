export function splashPlan(state) {
  const { cell, walls, crates, flowers, exit, balloons = [] } = state,
    wallSet = new Set(walls),
    crateSet = new Set(crates);
  const blocked = (x, y) =>
    wallSet.has(`${x},${y}`) ||
    crateSet.has(`${x},${y}`) ||
    balloons.some((b) => b.x === x && b.y === y);
  const route = (start, goal) => {
    const q = [{ ...start, path: [] }],
      seen = new Set([`${start.x},${start.y}`]);
    for (let at = 0; at < q.length; at++) {
      const p = q[at];
      if (goal(p)) return p.path;
      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
      ]) {
        const x = p.x + dx,
          y = p.y + dy,
          key = `${x},${y}`;
        if (
          x >= 0 &&
          y >= 0 &&
          x < 13 &&
          y < 9 &&
          !seen.has(key) &&
          !blocked(x, y)
        ) {
          seen.add(key);
          q.push({ x, y, path: [...p.path, { x, y, dx, dy }] });
        }
      }
    }
    return null;
  };
  if (flowers.every((f) => f.wet))
    return (route(cell, (p) => p.x === exit.x && p.y === exit.y) || []).map(
      (p) => ({ ...p, type: "move" }),
    );
  let choice;
  for (let y = 1; y < 8; y++)
    for (let x = 1; x < 12; x++) {
      if (blocked(x, y)) continue;
      const path = route(cell, (p) => p.x === x && p.y === y);
      if (!path) continue;
      const cells = [{ x, y }];
      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
      ])
        for (let n = 1; n <= 2; n++) {
          const xx = x + dx * n,
            yy = y + dy * n;
          if (wallSet.has(`${xx},${yy}`)) break;
          cells.push({ x: xx, y: yy });
          if (crateSet.has(`${xx},${yy}`)) break;
        }
      const wet = cells.filter((c) =>
          flowers.some((f) => !f.wet && f.x === c.x && f.y === c.y),
        ).length,
        clear = cells.filter((c) => crateSet.has(`${c.x},${c.y}`)).length;
      if (!wet && !clear) continue;
      const escape = route(
        { x, y },
        (p) => !cells.some((c) => c.x === p.x && c.y === p.y),
      );
      if (!escape || escape.length > 4) continue;
      const value = wet * 100 + clear * 5 - path.length;
      if (!choice || value > choice.value) choice = { value, path, escape };
    }
  if (!choice) throw Error("No safe balloon plan");
  return [
    ...choice.path.map((p) => ({ ...p, type: "move" })),
    { type: "place" },
    ...choice.escape.map((p) => ({ ...p, type: "move" })),
    { type: "pop" },
    { type: "wait" },
  ];
}
