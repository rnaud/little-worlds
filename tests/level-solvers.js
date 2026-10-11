import { gridRoute } from "../src/navigation.js";
const directions = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const key = (p, boxes) =>
  `${p.x},${p.y}|${boxes
    .map((b) => `${b.x},${b.y}`)
    .sort()
    .join(";")}`;
// Search pushes, using legal walking paths between them. This checks authored
// puzzle solvability without reaching into or mutating the running game.
export function solveGarden(g) {
  const queue = [
      { p: { ...g.player }, boxes: g.boxes.map((b) => ({ ...b })), route: [] },
    ],
    seen = new Set();
  for (let at = 0; at < queue.length; at++) {
    const state = queue[at];
    if (
      state.boxes.every((b) =>
        g.targets.some((t) => t.x === b.x && t.y === b.y),
      )
    )
      return state.route;
    const blocked = new Set([
      ...g.walls,
      ...state.boxes.map((b) => `${b.x},${b.y}`),
    ]);
    for (let index = 0; index < state.boxes.length; index++)
      for (const [dx, dy] of directions) {
        const box = state.boxes[index],
          next = { x: box.x + dx, y: box.y + dy },
          behind = { x: box.x - dx, y: box.y - dy };
        if (blocked.has(`${next.x},${next.y}`)) continue;
        const path = gridRoute(state.p, behind, blocked);
        if (!path) continue;
        const onTarget = g.targets.some(
          (t) => t.x === next.x && t.y === next.y,
        );
        if (
          !onTarget &&
          (g.walls.has(`${next.x - 1},${next.y}`) ||
            g.walls.has(`${next.x + 1},${next.y}`)) &&
          (g.walls.has(`${next.x},${next.y - 1}`) ||
            g.walls.has(`${next.x},${next.y + 1}`))
        )
          continue;
        const boxes = state.boxes.map((b, n) =>
            n === index ? next : { ...b },
          ),
          p = { ...box },
          k = key(p, boxes);
        if (seen.has(k)) continue;
        seen.add(k);
        const walk = path
          .slice(1)
          .map((point, n) => [point.x - path[n].x, point.y - path[n].y]);
        queue.push({ p, boxes, route: [...state.route, ...walk, [dx, dy]] });
      }
    if (queue.length > 250000)
      throw new Error(`Puzzle ${g.level} exceeded search budget`);
  }
  throw new Error(`Puzzle ${g.level} has no solution`);
}
