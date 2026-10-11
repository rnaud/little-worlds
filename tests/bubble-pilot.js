// Input-only pilot: navigates authored terraces and aims at visible sprites.
export function bubblePilot(g) {
  const p = g.player,
    alive = g.enemies.filter((e) => e.alive),
    platforms = g.platforms;
  if (!alive.length) return { x: 0, y: 0, current: {}, pressed: {} };
  const floor =
    platforms
      .map((b, n) => ({
        n,
        d: Math.abs(p.y + p.h / 2 - (b.y - b.h / 2)),
        inside: Math.abs(p.x - b.x) < b.w / 2 + 10,
      }))
      .filter((b) => b.inside)
      .sort((a, b) => a.d - b.d)[0]?.n || 0;
  const target = alive
    .slice()
    .sort(
      (a, b) =>
        Math.abs(a.floor - floor) - Math.abs(b.floor - floor) ||
        Math.abs(a.x - p.x) - Math.abs(b.x - p.x),
    )[0];
  let dx = target.x - p.x,
    jump = false,
    down = 0;
  if (target.floor !== floor) {
    const routes = [{ floor, path: [] }],
      seen = new Set([floor]);
    let route;
    for (let at = 0; at < routes.length; at++) {
      const q = routes[at];
      if (q.floor === target.floor) {
        route = q.path;
        break;
      }
      const from = platforms[q.floor];
      for (let n = 0; n < platforms.length; n++) {
        if (seen.has(n)) continue;
        const b = platforms[n],
          rise = from.y - from.h / 2 - (b.y - b.h / 2);
        const gap = Math.max(0, Math.abs(from.x - b.x) - (from.w + b.w) / 2);
        if (rise <= 96 && gap < 145) {
          seen.add(n);
          routes.push({ floor: n, path: [...q.path, n] });
        }
      }
    }
    const next = platforms[route?.[0] ?? target.floor],
      from = platforms[floor];
    const min = Math.max(from.x - from.w / 2 + 24, next.x - next.w / 2 + 24),
      max = Math.min(from.x + from.w / 2 - 24, next.x + next.w / 2 - 24);
    const launchX =
      min <= max
        ? Math.max(min, Math.min(max, p.x))
        : from.x + (next.x > from.x ? from.w / 2 - 28 : -from.w / 2 + 28);
    if (p.ground) {
      dx = launchX - p.x;
      if (Math.abs(dx) < 12) {
        jump = true;
        down = next.y > from.y ? 1 : 0;
        dx = next.x - p.x;
      }
    } else
      dx =
        Math.max(
          next.x - next.w / 2 + 30,
          Math.min(next.x + next.w / 2 - 30, p.x),
        ) - p.x;
  } else if (target.trapped && target.y < p.y - 50 && p.ground) jump = true;
  if (Math.abs(dx) < 12) dx = 0;
  return {
    x: Math.sign(dx),
    y: down,
    current: { a: true, b: true },
    pressed: { a: jump },
  };
}
