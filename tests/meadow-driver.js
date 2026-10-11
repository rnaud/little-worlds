// Route waypoints describe intended play, never assign actor positions or scores.
const routes = [
  [
    [230, 0],
    [735, 1],
    [1185, 2],
    [1720, 3],
    [2170, 4],
    [2220, 4],
  ],
  [
    [230, 0],
    [360, 5],
    [570, 6],
    [800, 7],
    [1050, 8],
    [1330, 9],
    [1670, 10],
    [1920, 11],
    [2130, 4],
  ],
  [
    [220, 0],
    { spring: 0 },
    [600, 4],
    [820, 1],
    { spring: 1 },
    [1000, 5],
    [1320, 6],
    [1430, 2],
    { spring: 2 },
    [1780, 7],
    [1920, 8],
    [2130, 3],
  ],
  [
    [250, 0],
    { platform: 4 },
    [800, 7],
    { platform: 5 },
    [1390, 8],
    { platform: 6 },
    [2130, 3],
  ],
  [
    [250, 0],
    [480, 3],
    [710, 4],
    [900, 5],
    [1110, 1],
    [1390, 6],
    [1590, 7],
    [1800, 8],
    [2130, 2],
  ],
  [
    [220, 0],
    { spring: 0 },
    [570, 3],
    { platform: 4 },
    [1060, 1],
    { spring: 1 },
    [1330, 5],
    [1580, 6],
    [1790, 7],
    [2130, 2],
  ],
];
export function meadowDriver(level) {
  let at = 0,
    holdingJump = false;
  const route = routes[level];
  return {
    get waypoint() {
      return at;
    },
    input(g) {
      const p = g.player;
      const on = g.platforms.findIndex(
        (b) =>
          !b.hidden &&
          p.ground &&
          Math.abs(p.y + p.h / 2 - (b.y - b.h / 2)) < 3 &&
          Math.abs(p.x - b.x) < (b.w + p.w) / 2,
      );
      let waypoint = route[at];
      const reached = Array.isArray(waypoint)
        ? on === waypoint[1] && Math.abs(p.x - waypoint[0]) < 26
        : waypoint.spring != null
          ? p.vy < -650 && Math.abs(p.x - g.springs[waypoint.spring].x) < 45
          : on === waypoint.platform &&
            Math.abs(p.x - g.platforms[waypoint.platform].x) < 30;
      if (reached && at < route.length - 1) waypoint = route[++at];
      const index = Array.isArray(waypoint) ? waypoint[1] : waypoint.platform;
      const target = index != null ? g.platforms[index] : null;
      const x = Array.isArray(waypoint)
        ? waypoint[0]
        : waypoint.spring != null
          ? g.springs[waypoint.spring].x
          : target.x;
      const delta = x - p.x,
        dir = Math.abs(delta) > 5 ? Math.sign(delta) : 0;
      let jump = false;
      if (p.ground && on !== index && target && !target.hidden) {
        const floor = g.platforms[on],
          rise = target.y - target.h / 2 - (p.y + p.h / 2),
          v = g.gentle ? 520 : 480;
        const flight = (v + Math.sqrt(Math.max(0, v * v + 2300 * rise))) / 1150;
        const closest = Math.abs(delta) - target.w / 2 + 15;
        const nearEdge =
          floor &&
          Math.abs(p.x - (floor.x + (Math.sign(delta) * floor.w) / 2)) < 48;
        if (
          closest < (level === 0 ? 250 : 350) * flight * 0.88 &&
          (Math.abs(delta) < 180 || nearEdge)
        )
          jump = true;
      }
      const hold = jump || (!p.ground && p.vy < 0 && holdingJump);
      const input = {
        x: dir,
        y: 0,
        current: { b: level !== 0, a: hold },
        pressed: { a: jump },
        released: { a: holdingJump && !hold },
      };
      holdingJump = hold;
      return input;
    },
  };
}
