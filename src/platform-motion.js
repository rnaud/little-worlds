// Shared player physics keeps the parent helper and lead hero equally responsive.
// Coordinates remain continuous in simulation; the painter snaps the final image.
const overlap = (a, b) =>
  Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
  Math.abs(a.y - b.y) < (a.h + b.h) / 2;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export function platformMotion(state, dt, input, world, hero = "gaia") {
  const p = state.player,
    height = hero === "bean" ? 38 : 54;
  const previousFoot = p.y + p.h / 2;
  state.springLock = Math.max(0, (state.springLock || 0) - dt);
  if (p.h !== height) {
    p.y += (p.h - height) / 2;
    p.h = height;
  }
  state.dropTime = Math.max(0, (state.dropTime || 0) - dt);
  let floors = world.platforms.filter((b) => !(b.hidden > 0));
  let dropping = false;
  if (p.ground) {
    const riding = floors.find(
      (b) =>
        Math.abs(p.y + p.h / 2 - (b.y - b.h / 2)) < 3 &&
        Math.abs(p.x - b.x) < (b.w + p.w) / 2,
    );
    if (riding) {
      p.x += riding.dx || 0;
      p.y += riding.dy || 0;
      if (riding.oneWay && input.y > 0.3 && input.pressed.a) {
        state.dropTime = 0.22;
        dropping = true;
        p.ground = false;
        p.y += 4;
        p.vy = 60;
        state.coyote = 0;
        state.jumpBuffer = 0;
      }
    }
  }
  if (state.dropTime > 0) floors = floors.filter((b) => !b.oneWay);
  state.coyote = p.ground ? 0.12 : Math.max(0, state.coyote - dt);
  state.jumpBuffer = Math.max(0, state.jumpBuffer - dt);
  if (!dropping && (input.pressed.a || input.pressed.up))
    state.jumpBuffer = 0.14;
  if (p.wall) {
    state.wallGrace = 0.1;
    state.lastWall = p.wall;
  } else state.wallGrace = Math.max(0, state.wallGrace - dt);
  if (
    (input.released?.a || input.released?.up) &&
    p.vy < -180 &&
    state.dashTime <= 0 &&
    state.springLock <= 0
  )
    p.vy = -180;
  if (input.x) p.face = input.x;
  if (state.jumpBuffer > 0 && (state.coyote > 0 || state.wallGrace > 0)) {
    world.dustBurst(p.x, p.y + p.h / 2, 4);
    p.vy = -(world.gentle ? 520 : 480);
    if (state.wallGrace > 0 && !p.ground) p.vx = -state.lastWall * 310;
    state.wallGrace = 0;
    state.coyote = 0;
    state.jumpBuffer = 0;
    p.ground = false;
    if (world.sound.effect) world.sound.effect("jump");
    else world.sound.play(420, 0.09);
  }
  if (world.precision && input.pressed.b && p.dash > 0) {
    state.dashTime = 0.16;
    p.dash = world.gentle ? 1 : 0;
    const dx = input.x || (!input.y ? p.face : 0),
      dy = input.y,
      n = Math.hypot(dx, dy) || 1;
    p.vx = (dx / n) * 650;
    p.vy = (dy / n) * 650;
    if (world.sound.effect) world.sound.effect("dash");
    else world.sound.play(740, 0.08);
  }
  if (state.dashTime > 0) {
    state.dashTime -= dt;
    state.trail?.push({ x: p.x, y: p.y, life: 0.25 });
  } else {
    const target =
      input.x * (world.precision ? 225 : input.current.b ? 350 : 250);
    p.vx += (target - p.vx) * Math.min(1, dt * (p.ground ? 18 : 9));
    p.vy = Math.min(p.vy + 1150 * dt, 700);
    if (p.wall && input.x === p.wall && p.vy > 0) p.vy = world.gentle ? 35 : 85;
  }
  p.wall = 0;
  p.x += p.vx * dt;
  for (const b of floors)
    if (!b.oneWay && overlap(p, b)) {
      if (p.vx > 0) {
        p.x = b.x - b.w / 2 - p.w / 2;
        p.wall = 1;
      } else if (p.vx < 0) {
        p.x = b.x + b.w / 2 + p.w / 2;
        p.wall = -1;
      }
      p.vx = 0;
    }
  p.y += p.vy * dt;
  p.ground = false;
  for (const b of floors)
    if (
      overlap(p, b) &&
      (!b.oneWay || (p.vy >= 0 && previousFoot <= b.y - b.h / 2 + 3))
    ) {
      if (p.vy >= 0) {
        p.y = b.y - b.h / 2 - p.h / 2;
        p.ground = true;
        p.dash = 1;
        if (b.crumble && b.shake == null) b.shake = world.gentle ? 1.6 : 1.05;
      } else p.y = b.y + b.h / 2 + p.h / 2;
      p.vy = 0;
    }
  p.x = clamp(p.x, hero === "bean" ? 42 : 26, world.finishX + 110);
  for (const spring of world.springs || [])
    if (
      p.vy >= 0 &&
      Math.abs(p.x - spring.x) < 32 &&
      p.y + p.h / 2 >= spring.y - 42 &&
      (previousFoot <= spring.y - 34 || p.ground)
    ) {
      p.y = spring.y - 42 - p.h / 2;
      p.vy = -790;
      p.ground = false;
      state.coyote = 0;
      state.springLock = 0.24;
      spring.flash = 0.3;
      world.burst(spring.x, spring.y - 12, "#a5d8e6");
      world.sound.play(880, 0.12);
    }
  return p.y > 600;
}
