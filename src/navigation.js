// Four-neighbor routing for the small garden. Paths never cut blocked corners.
export function gridRoute(start, goal, blocked, width = 9, height = 8) {
  const key = ({ x, y }) => `${x},${y}`;
  const first = key(start),
    last = key(goal);
  if (blocked.has(last)) return null;
  const queue = [start],
    previous = new Map([[first, null]]);
  for (let head = 0; head < queue.length; head++) {
    const at = queue[head];
    if (key(at) === last) {
      const route = [];
      let cursor = at;
      while (cursor) {
        route.push(cursor);
        cursor = previous.get(key(cursor));
      }
      return route.reverse();
    }
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      const next = { x: at.x + dx, y: at.y + dy },
        k = key(next);
      if (
        next.x < 0 ||
        next.y < 0 ||
        next.x >= width ||
        next.y >= height ||
        blocked.has(k) ||
        previous.has(k)
      )
        continue;
      previous.set(k, at);
      queue.push(next);
    }
  }
  return null;
}
