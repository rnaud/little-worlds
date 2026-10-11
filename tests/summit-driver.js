// Follow the authored route with ordinary jump/dash inputs, never teleport.
const route = [
  [390, 1],
  [570, 2],
  [790, 3],
  [1290, 4],
  [1420, 5],
  [1580, 6],
  [1760, 7],
  [2180, 8],
  [2260, 8],
];
export function summitDriver() {
  let at = 0,
    held = false,
    airTime = 0,
    dashUsed = false;
  return {
    get waypoint() {
      return at;
    },
    input(g) {
      const p = g.player,
        on = g.platforms.findIndex(
          (b) =>
            p.ground &&
            Math.abs(p.y + p.h / 2 - (b.y - b.h / 2)) < 3 &&
            Math.abs(p.x - b.x) < (b.w + p.w) / 2,
        );
      if (
        on === route[at][1] &&
        Math.abs(p.x - route[at][0]) < 25 &&
        at < route.length - 1
      )
        at++;
      const [x, index] = route[at],
        target = g.platforms[index],
        delta = x - p.x,
        dir = Math.abs(delta) > 5 ? Math.sign(delta) : 0;
      const floor = g.platforms[on],
        gap = floor ? target.x - target.w / 2 - (floor.x + floor.w / 2) : 0;
      const dashGap = at === 3 || at === 7;
      const edge = floor ? floor.x + floor.w / 2 : 0;
      const rise = target.y - target.h / 2 - (p.y + p.h / 2),
        v = g.gentle ? 520 : 480;
      const flight = (v + Math.sqrt(Math.max(0, v * v + 2300 * rise))) / 1150;
      const closest = Math.abs(delta) - target.w / 2 + 8;
      const jump =
        p.ground &&
        on !== index &&
        (dashGap
          ? p.x > edge - 24
          : closest < 225 * flight * 0.86 &&
            (Math.abs(delta) < 190 || p.x > edge - 32));
      airTime = p.ground ? 0 : airTime + 1 / 120;
      if (p.ground) dashUsed = false;
      const dash =
        !dashUsed &&
        dashGap &&
        !p.ground &&
        p.dash > 0 &&
        p.vy > -80 &&
        airTime > 0.16;
      if (dash) dashUsed = true;
      const hold = jump || (!p.ground && held && p.vy < 0);
      const i = {
        x: dir,
        y: 0,
        current: { a: hold, b: dash },
        pressed: { a: jump, b: dash },
        released: { a: held && !hold },
      };
      held = hold;
      return i;
    },
  };
}
