import { clamp, overlap } from "./engine.js";
import { ActorAnimation, directionalState } from "./animation.js";
import { gridRoute } from "./navigation.js";

// A companion owns position, speed and animation. It is never a render offset.
export class BeanCompanion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.face = 1;
    this.animation = 0;
    this.moving = false;
    this.state = "waiting";
    this.actor = new ActorAnimation();
    this.restTime = 0;
    this.route = [];
    this.lastSample = null;
    this.platform = 0;
  }
  platformStep(dt, player, platforms) {
    this.clock = (this.clock || 0) + dt;
    this.landings ||= [];
    const current = platforms.findIndex(
      (b) =>
        !(b.hidden > 0) &&
        player.ground &&
        Math.abs(player.y + player.h / 2 - (b.y - b.h / 2)) < 5 &&
        Math.abs(player.x - b.x) < b.w / 2 + 8,
    );
    if (current >= 0 && current !== (this.landings.at(-1) ?? this.platform))
      this.landings.push(current);
    if (this.leap && platforms[this.leap.platform]?.hidden > 0)
      this.leap = null;
    if (!this.leap && platforms[this.platform]?.hidden > 0) {
      const index =
        current >= 0
          ? current
          : platforms
              .map((b, index) => ({ b, index }))
              .filter(({ b }) => !b.hidden && !b.crumble)
              .sort(
                (a, b) =>
                  Math.abs(a.b.x - player.x) - Math.abs(b.b.x - player.x),
              )[0].index;
      const safe = platforms[index];
      this.leap = {
        x: this.x,
        y: this.y,
        tx: clamp(
          player.x - 65,
          safe.x - safe.w / 2 + 36,
          safe.x + safe.w / 2 - 36,
        ),
        ty: safe.y - safe.h / 2 - 13.68,
        platform: index,
        elapsed: 0,
        duration: clamp(Math.abs(safe.x - this.x) / 380, 0.35, 1.1),
        height: 80,
      };
      this.landings = [];
    }
    if (this.leap) {
      const j = this.leap;
      j.tx += platforms[j.platform]?.dx || 0;
      j.elapsed = Math.min(j.duration, j.elapsed + dt);
      const t = j.elapsed / j.duration;
      this.x = j.x + (j.tx - j.x) * t;
      this.y = j.y + (j.ty - j.y) * t - Math.sin(t * Math.PI) * j.height;
      this.state = "bounding after you";
      this.moving = true;
      this.animation += dt;
      this.actor.update(dt, { state: t < 0.6 ? "jump" : "fall" });
      if (t === 1) {
        this.platform = j.platform;
        this.leap = null;
      }
      return;
    }
    const floor = platforms[this.platform];
    this.x += floor.dx || 0;
    this.y = floor.y - floor.h / 2 - 13.68;
    this.landings = this.landings.filter((index) => !platforms[index]?.hidden);
    if (this.landings.length) {
      const index = this.landings.shift(),
        destination = platforms[index];
      const tx = clamp(
        player.x - (player.face || 1) * 65,
        destination.x - destination.w / 2 + 36,
        destination.x + destination.w / 2 - 36,
      );
      this.face = Math.sign(tx - this.x) || this.face;
      this.leap = {
        x: this.x,
        y: this.y,
        tx,
        ty: destination.y - destination.h / 2 - 13.68,
        platform: index,
        elapsed: 0,
        duration: clamp(Math.abs(tx - this.x) / 360, 0.35, 0.85),
        height: Math.max(40, Math.abs(destination.y - floor.y) * 0.35),
      };
      return;
    }
    const exploring = this.clock % 11 > 3 && this.clock % 11 < 5.5;
    const target = clamp(
      player.x + (player.face || 1) * (exploring ? 110 : -88),
      floor.x - floor.w / 2 + 36,
      floor.x + floor.w / 2 - 36,
    );
    this.moveToward(
      dt,
      { x: target, y: this.y },
      [],
      exploring ? "exploring" : "returning",
    );
  }
  moveToward(
    dt,
    target,
    walls = [],
    state = "following",
    speed = 185,
    animate = true,
  ) {
    const dx = target.x - this.x,
      dy = target.y - this.y,
      n = Math.hypot(dx, dy);
    this.moving = false;
    if (n > 7) {
      const step = Math.min(n, speed * dt);
      for (const axis of ["x", "y"]) {
        const before = this[axis];
        this[axis] += ((axis === "x" ? dx : dy) / n) * step;
        if (
          walls.some((w) => overlap({ x: this.x, y: this.y, w: 18, h: 18 }, w))
        )
          this[axis] = before;
        this.moving ||= before !== this[axis];
      }
      if (Math.abs(dx) > 1) this.face = Math.sign(dx);
      this.direction =
        Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? "up" : "down") : "side";
    }
    this.state = this.moving ? state : "sniffing";
    if (animate) this.animate(dt, speed);
  }
  animate(dt, speed = 185) {
    this.animation = this.moving ? this.animation + dt : 0;
    this.restTime = this.moving ? 0 : this.restTime + dt;
    const rest = this.restTime % 9;
    const state = this.moving
      ? "run"
      : rest > 6.5
        ? "play"
        : rest > 4
          ? "sit"
          : rest > 2
            ? "curious"
            : "sniff";
    this.actor.update(dt, { state, speed });
  }
  roamStep(dt, player, bounds, walls = []) {
    this.clock = (this.clock || 0) + dt;
    const phase = this.clock % 11,
      exploring = phase > 3 && phase < 5.5;
    const target = {
      x: clamp(player.x + (exploring ? 110 : -85), bounds.left, bounds.right),
      y: clamp(player.y + (exploring ? -32 : 24), bounds.top, bounds.bottom),
    };
    if (!clearSight(this, target, walls)) {
      target.x = player.x;
      target.y = player.y;
    }
    this.moveToward(
      dt,
      target,
      walls,
      exploring ? "exploring" : "returning",
      330,
    );
  }
  gardenStep(dt, player, hedges, pots, face = 1) {
    this.clock = (this.clock || 0) + dt;
    const exploring = this.clock % 11 > 3 && this.clock % 11 < 5.5;
    const blocked = new Set([...hedges, ...pots.map((b) => `${b.x},${b.y}`)]);
    const start = {
      x: Math.round((this.x - 264) / 54),
      y: Math.round((this.y - 80) / 54),
    };
    const desired = {
      x: player.x + (exploring ? 2 : -1) * face,
      y: player.y + (exploring ? -1 : 1),
    };
    const candidates = [];
    for (let y = 1; y < 7; y++)
      for (let x = 1; x < 8; x++) {
        const distance = Math.abs(x - player.x) + Math.abs(y - player.y);
        if (distance >= 1 && distance <= 3 && !blocked.has(`${x},${y}`))
          candidates.push({ x, y });
      }
    candidates.sort(
      (a, b) =>
        Math.hypot(a.x - desired.x, a.y - desired.y) -
        Math.hypot(b.x - desired.x, b.y - desired.y),
    );
    let route = null;
    for (const target of candidates) {
      route = gridRoute(start, target, blocked);
      if (route) break;
    }
    const next = route?.[1] || route?.[0];
    const walls = [...blocked].map((k) => {
      const [x, y] = k.split(",").map(Number);
      return { x: 264 + x * 54, y: 80 + y * 54, w: 48, h: 48 };
    });
    // A pushed pot may enter Bean's current cell. He yields without blocking the puzzle.
    const activeWalls = walls.filter(
      (w) => !overlap({ x: this.x, y: this.y, w: 18, h: 18 }, w),
    );
    if (next)
      this.moveToward(
        dt,
        { x: 264 + next.x * 54, y: 80 + next.y * 54 },
        activeWalls,
        exploring ? "exploring" : "returning",
        150,
      );
    else {
      this.moving = false;
      this.state = "waiting";
      this.animate(dt);
    }
  }
  forestStep(dt, player, walls) {
    // Save the route the player actually traversed; following it avoids cutting corners.
    if (
      !this.lastSample ||
      Math.hypot(player.x - this.lastSample.x, player.y - this.lastSample.y) > 9
    ) {
      this.lastSample = { x: player.x, y: player.y };
      this.route.push({ ...this.lastSample });
      if (this.route.length > 1200) this.route.shift();
    }
    this.clock = (this.clock || 0) + dt;
    const phase = this.clock % 11;
    if (
      Math.hypot(player.x - this.x, player.y - this.y) < 120 &&
      clearSight(this, player, walls) &&
      phase > 3 &&
      phase < 6.5
    ) {
      const target =
        phase < 5.5
          ? {
              x: clamp(player.x + 75, 45, 915),
              y: clamp(player.y - 30, 78, 493),
            }
          : {
              x: clamp(player.x - 75, 45, 915),
              y: clamp(player.y + 22, 78, 493),
            };
      if (clearSight(this, target, walls)) {
        this.moveToward(
          dt,
          target,
          walls,
          phase < 5.5 ? "exploring" : "returning",
        );
        this.route = [{ x: player.x, y: player.y }];
        return;
      }
    }
    const distance = Math.hypot(player.x - this.x, player.y - this.y);
    this.moving = false;
    let budget = (distance > 130 ? 360 : 190) * dt;
    while (distance > 90 && this.route.length && budget > 0) {
      const target = this.route[0],
        dx = target.x - this.x,
        dy = target.y - this.y;
      const n = Math.hypot(dx, dy);
      if (n < 3) {
        this.route.shift();
        continue;
      }
      const step = Math.min(budget, n),
        oldX = this.x,
        oldY = this.y;
      this.moveToward(step / 360, target, walls, "following", 360, false);
      // moveToward uses a small idle radius; consume nearby waypoints too.
      if (n <= 7) {
        this.route.shift();
        continue;
      }
      budget -= step;
      if (this.x === oldX && this.y === oldY) break;
      this.moving = true;
    }
    this.state = this.moving ? "following" : "sniffing";
    this.animate(dt, distance > 130 ? 360 : 190);
  }
  draw(p, camera = 0) {
    if (p.hero !== "bean")
      p.person(
        this.x - camera,
        this.y,
        0.76,
        this.actor.time,
        ["up", "down"].includes(this.direction) ? 1 : this.face,
        false,
        "bean",
        directionalState(this.actor.state, this.direction),
      );
  }
}

export function clearSight(a, b, walls) {
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 6);
  for (let k = 1; k < steps; k++) {
    const t = k / steps;
    if (
      walls.some(
        (w) =>
          Math.abs(a.x + (b.x - a.x) * t - w.x) < w.w / 2 &&
          Math.abs(a.y + (b.y - a.y) * t - w.y) < w.h / 2,
      )
    )
      return false;
  }
  return true;
}
