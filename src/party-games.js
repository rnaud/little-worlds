import { World } from "./world.js";
import { ActorAnimation } from "./animation.js";
import { clamp, overlap } from "./engine.js";
import { BeanCompanion } from "./companions.js";
import { platformMotion } from "./platform-motion.js";
import { gridRoute } from "./navigation.js";

export const BUBBLE_ROOMS = [
  {
    name: "The Soapworks",
    lesson: "B blows a bubble. Touch a trapped sprite to set it free.",
    platforms: [
      [480, 510, 930, 36],
      [215, 411, 250, 18],
      [695, 411, 250, 18],
      [455, 324, 260, 18],
    ],
    enemies: [
      [324, 0],
      [645, 0],
      [190, 1],
      [720, 2],
    ],
  },
  {
    name: "The Floating Baths",
    lesson: "Bubbles drift upward. Jump to catch them before they open.",
    platforms: [
      [480, 510, 930, 36],
      [145, 411, 190, 18],
      [480, 411, 210, 18],
      [815, 411, 190, 18],
      [305, 324, 185, 18],
      [655, 324, 185, 18],
      [480, 237, 170, 18],
    ],
    enemies: [
      [400, 0],
      [740, 0],
      [135, 1],
      [480, 2],
      [780, 3],
      [645, 5],
    ],
  },
  {
    name: "The Moon Pool",
    lesson: "Rescue nearby bubbles together for a sparkling chain.",
    platforms: [
      [480, 510, 930, 36],
      [170, 411, 240, 18],
      [485, 411, 195, 18],
      [795, 411, 210, 18],
      [320, 324, 225, 18],
      [660, 324, 225, 18],
      [480, 237, 220, 18],
    ],
    enemies: [
      [240, 0],
      [680, 0],
      [155, 1],
      [475, 2],
      [810, 3],
      [315, 4],
      [650, 5],
      [480, 6],
    ],
  },
];
export class BubbleRescue extends World {
  constructor(gentle, sound) {
    super(gentle, sound);
    this.kind = "bubbles";
    this.room = 0;
    this.hearts = 3;
    this.rescued = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.comboTime = 0;
    this.inv = 0;
    this.deaths = 0;
    this.loadRoom();
  }
  loadRoom() {
    const room = BUBBLE_ROOMS[this.room];
    this.platforms = room.platforms.map(([x, y, w, h], n) => ({
      x,
      y,
      w,
      h,
      oneWay: n > 0,
    }));
    this.player = {
      x: 80,
      y: 450,
      w: 30,
      h: 54,
      vx: 0,
      vy: 0,
      ground: false,
      face: 1,
      dash: 1,
      wall: 0,
    };
    this.bean = new BeanCompanion(45, 478);
    this.finishX = 820;
    this.springs = [];
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.wallGrace = 0;
    this.dashTime = 0;
    this.shots = [];
    this.fruits = [];
    this.shotCooldown = 0;
    this.roomClear = 0;
    this.enemies = room.enemies.map(([x, floor], n) => ({
      x,
      y: this.platforms[floor].y - this.platforms[floor].h / 2 - 20,
      w: 33,
      h: 36,
      floor,
      face: n % 2 ? -1 : 1,
      alive: true,
      trapped: false,
      trapTime: 0,
      phase: n * 1.2,
    }));
    this.objective = `Room ${this.room + 1}/3 · Rescue ${this.enemies.length} woodland sprites`;
    this.hint = room.lesson;
    if (this.buddy) this.setBuddy(true, this.buddy.hero);
    this.announce(room.name);
  }
  setBuddy(enabled, hero = "nur") {
    this.buddy = enabled
      ? {
          hero,
          player: { ...this.player, x: this.player.x + 60, vx: 0, vy: 0 },
          actor: new ActorAnimation(),
          inv: 0,
          coyote: 0,
          jumpBuffer: 0,
          wallGrace: 0,
          dashTime: 0,
          shotCooldown: 0,
          actionTime: 0,
        }
      : null;
  }
  recallBuddy() {
    if (!this.buddy) return;
    Object.assign(this.buddy.player, {
      ...this.player,
      x: clamp(this.player.x - 45, 35, 925),
      vx: 0,
      vy: 0,
    });
    this.buddy.inv = 1.5;
  }
  blow(actor = this) {
    if (actor.shotCooldown > 0) return;
    actor.shotCooldown = this.gentle ? 0.22 : 0.3;
    const p = actor.player;
    this.shots.push({
      x: p.x + p.face * 25,
      y: p.y - 8,
      vx: p.face * 295,
      age: 0,
      w: 36,
      h: 36,
    });
    actor.actionTime = 0.22;
    this.cue("bubble");
    // A nearby trapped sprite can be popped without needing an exact landing.
    for (const e of this.enemies)
      if (e.alive && e.trapped && Math.hypot(e.x - p.x, e.y - p.y) < 85)
        this.rescue(e);
  }
  rescue(e) {
    if (!e.alive) return;
    e.alive = false;
    this.rescued++;
    this.combo = this.comboTime > 0 ? this.combo + 1 : 1;
    this.comboTime = 2.2;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.score += 100 * this.combo;
    this.burst(e.x, e.y, "#b9edee", "pop");
    this.fruits.push({ x: e.x, y: e.y, vy: -80, life: 8 });
    if (this.combo > 1) this.announce(`${this.combo} together!`);
  }
  update(dt, input) {
    if (this.done || this.failed) return;
    this.tick(dt);
    this.inv = Math.max(0, this.inv - dt);
    this.shotCooldown = Math.max(0, this.shotCooldown - dt);
    this.comboTime = Math.max(0, this.comboTime - dt);
    // B is the bubble action here; it never also enables platform sprint.
    platformMotion(
      this,
      dt,
      { ...input, current: { ...input.current, b: false } },
      this,
      this.hero,
    );
    this.player.x = clamp(this.player.x, 35, 925);
    if (input.current.b || input.pressed.b) this.blow();
    if (this.buddy) {
      const b = this.buddy,
        controls = input.second || { x: 0, y: 0, current: {}, pressed: {} };
      b.inv = Math.max(0, b.inv - dt);
      b.shotCooldown = Math.max(0, b.shotCooldown - dt);
      b.actionTime = Math.max(0, b.actionTime - dt);
      platformMotion(
        b,
        dt,
        { ...controls, current: { ...controls.current, b: false } },
        this,
        b.hero,
      );
      b.player.x = clamp(b.player.x, 35, 925);
      if (controls.pressed.recall) this.recallBuddy();
      if (controls.current.b || controls.pressed.b) this.blow(b);
      b.actor.update(dt, {
        moving: Math.abs(b.player.vx) > 25,
        ground: b.player.ground,
        vy: b.player.vy,
        action: b.actionTime > 0,
        hurt: b.inv > 1.2,
      });
    }
    const p = this.player;
    for (const shot of this.shots) {
      shot.age += dt;
      shot.x += shot.vx * dt;
      shot.vx *= Math.exp(-1.2 * dt);
      shot.y -= Math.max(0, shot.age - 0.35) * 35 * dt;
      for (const e of this.enemies)
        if (e.alive && !e.trapped && overlap(shot, e)) {
          e.trapped = true;
          e.trapTime = this.gentle ? 12 : 8;
          e.y -= 6;
          shot.age = 99;
          this.cue("bubble");
          break;
        }
    }
    this.shots = this.shots.filter((s) => s.age < 2.8 && s.x > 0 && s.x < 960);
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const floor = this.platforms[e.floor];
      if (e.trapped) {
        e.trapTime -= dt;
        e.y = Math.max(95, e.y - (this.gentle ? 14 : 20) * dt);
        e.x += Math.sin(this.t * 2 + e.phase) * 9 * dt;
        if (
          [p, this.buddy?.player].some(
            (body) =>
              body &&
              Math.hypot(e.x - body.x, e.y - body.y) < (this.gentle ? 62 : 48),
          )
        ) {
          this.rescue(e);
          continue;
        }
        if (e.trapTime <= 0) {
          e.trapped = false;
          e.y = floor.y - floor.h / 2 - 20;
          this.announce("That bubble opened. Try again!");
        }
      } else {
        e.x += e.face * (this.gentle ? 35 : 54) * dt;
        const left = floor.x - floor.w / 2 + 30,
          right = floor.x + floor.w / 2 - 30;
        if (e.x < left || e.x > right) {
          e.x = clamp(e.x, left, right);
          e.face *= -1;
        }
        if (this.buddy && this.buddy.inv <= 0 && overlap(this.buddy.player, e))
          this.recallBuddy();
        if (this.inv <= 0 && overlap(p, e)) {
          this.inv = 1.5;
          this.cue("hurt");
          if (this.gentle) {
            e.trapped = true;
            e.trapTime = 12;
            this.announce("A gentle bump made a bubble. Touch it!");
          } else {
            this.hearts--;
            p.vy = -240;
            p.vx = -e.face * 230;
            if (this.hearts <= 0) this.failed = true;
          }
        }
      }
    }
    for (const fruit of this.fruits) {
      fruit.life -= dt;
      fruit.vy += 400 * dt;
      fruit.y = Math.min(475, fruit.y + fruit.vy * dt);
      if (
        [p, this.buddy?.player].some(
          (body) => body && Math.hypot(body.x - fruit.x, body.y - fruit.y) < 50,
        )
      ) {
        fruit.life = 0;
        this.score += 25;
        this.burst(fruit.x, fruit.y, "#ffe4a0");
      }
    }
    this.fruits = this.fruits.filter((f) => f.life > 0);
    this.bean.platformStep(dt, p, this.platforms);
    const remaining = this.enemies.filter((e) => e.alive).length;
    this.message = `${this.enemies.length - remaining}/${this.enemies.length} rescued · ${this.score} points${this.gentle ? "" : ` · ${this.hearts} hearts`}`;
    if (!remaining) {
      this.roomClear += dt;
      this.hint = "Room clear! On to the next bath…";
      if (this.roomClear > 1.5) {
        if (this.room === BUBBLE_ROOMS.length - 1) this.win();
        else {
          this.room++;
          this.hearts = Math.min(3, this.hearts + 1);
          this.loadRoom();
        }
      }
    }
  }
  draw(p) {
    p.backdrop("bubbles");
    for (const b of this.platforms) {
      p.rect(b.x, b.y, b.w, b.h, "#335d79");
      p.rect(b.x, b.y - b.h / 2 + 3, b.w, 6, "#b3ebdf");
      p.rect(b.x, b.y + b.h / 2 - 3, b.w, 6, "#233a59");
      for (let x = b.x - b.w / 2 + 12; x < b.x + b.w / 2; x += 30)
        p.rect(x, b.y + 1, 12, 3, "#4c8096");
    }
    for (const fruit of this.fruits) p.banana(fruit.x, fruit.y, 0.8);
    for (const shot of this.shots)
      this.drawBubble(p, shot.x, shot.y, 18, false);
    for (const e of this.enemies)
      if (e.alive) {
        if (e.trapped) this.drawBubble(p, e.x, e.y, 28, e.trapTime < 2);
        p.creature(
          e.floor % 2 ? "fern-spirit" : "leaf-slime",
          e.x,
          e.y + 5,
          this.presentationTime + e.phase,
          0.65,
          e.face < 0,
        );
        if (e.trapped) {
          p.star(e.x, e.y - 35, 5, "#fff0b9");
        }
      }
    this.bean.draw(p);
    if (this.buddy) {
      const b = this.buddy;
      p.person(
        b.player.x,
        b.player.y + b.player.h / 2 - 18,
        0.85,
        b.actor.time,
        b.player.face,
        b.inv > 0,
        b.hero,
        b.actor.state,
      );
    }
    this.drawHero(
      p,
      this.player.x,
      this.player.y + this.player.h / 2 - 18,
      0.85,
      this.player.face,
      this.inv > 0,
    );
    this.effects(p);
    if (this.roomClear > 0) {
      p.rect(480, 72, 300, 33, "#243b59");
      for (let i = 0; i < 5; i++) p.star(405 + i * 36, 72, 8, "#fff0b9");
    }
  }
  drawBubble(p, x, y, r, warning) {
    const col = warning ? "#f2b18e" : "#9de0e2";
    p.circle(x, y, r, col);
    p.circle(x, y, r - 3, "#315778");
    p.rect(x - r / 2, y - r / 2, 6, 6, "#fff3d7");
    p.rect(x + r / 2, y + r / 2, 3, 6, "#91b9e4");
  }
}

const COLS = 13,
  ROWS = 9,
  CELL = 54,
  OX = 129,
  OY = 27;
const cellKey = (x, y) => `${x},${y}`;
const center = (x, y) => ({
  x: OX + x * CELL + CELL / 2,
  y: OY + y * CELL + CELL / 2,
});
export const SPLASH_ROOMS = [
  {
    name: "The Courtyard",
    flowers: [
      [5, 1],
      [9, 3],
      [7, 7],
    ],
    crates: [
      [3, 1],
      [3, 2],
      [1, 3],
      [2, 3],
      [5, 3],
      [5, 4],
      [5, 5],
      [7, 5],
      [8, 5],
      [9, 5],
      [9, 6],
      [10, 7],
    ],
    start: [1, 1],
    exit: [11, 7],
  },
  {
    name: "The Lemon Grove",
    flowers: [
      [3, 5],
      [7, 1],
      [11, 5],
    ],
    crates: [
      [3, 1],
      [1, 3],
      [3, 3],
      [3, 4],
      [5, 1],
      [5, 2],
      [5, 3],
      [5, 5],
      [5, 6],
      [7, 3],
      [7, 4],
      [9, 1],
      [9, 3],
      [9, 4],
      [9, 5],
      [9, 7],
      [10, 5],
    ],
    start: [1, 1],
    exit: [11, 7],
  },
  {
    name: "The Fountain Party",
    flowers: [
      [3, 7],
      [5, 3],
      [9, 1],
      [11, 5],
    ],
    crates: [
      [3, 1],
      [1, 3],
      [2, 3],
      [3, 3],
      [3, 5],
      [4, 5],
      [5, 1],
      [5, 2],
      [5, 5],
      [5, 7],
      [6, 7],
      [7, 1],
      [7, 3],
      [7, 5],
      [8, 5],
      [9, 3],
      [9, 4],
      [9, 7],
      [10, 3],
      [11, 3],
      [11, 6],
    ],
    start: [1, 1],
    exit: [11, 7],
  },
];
export class SplashMaze extends World {
  constructor(gentle, sound) {
    super(gentle, sound);
    this.kind = "splash";
    this.room = 0;
    this.hearts = 3;
    this.inv = 0;
    this.flowersWatered = 0;
    this.balloonCount = 0;
    this.loadRoom();
  }
  loadRoom() {
    const spec = SPLASH_ROOMS[this.room];
    this.walls = new Set();
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (
          x === 0 ||
          y === 0 ||
          x === COLS - 1 ||
          y === ROWS - 1 ||
          (x % 2 === 0 && y % 2 === 0)
        )
          this.walls.add(cellKey(x, y));
    this.crates = new Set(spec.crates.map(([x, y]) => cellKey(x, y)));
    this.flowers = spec.flowers.map(([x, y]) => ({ x, y, wet: false }));
    this.exit = { x: spec.exit[0], y: spec.exit[1] };
    this.cell = { x: spec.start[0], y: spec.start[1] };
    this.player = {
      ...center(this.cell.x, this.cell.y),
      face: 1,
      w: 26,
      h: 24,
    };
    this.renderPlayer = { ...this.player };
    this.bean = new BeanCompanion(this.player.x, this.player.y + 20);
    this.direction = "down";
    this.balloons = [];
    this.splashes = [];
    this.stepTimer = 0;
    this.inv = 0;
    this.lastDir = "";
    this.objective = `Garden ${this.room + 1}/3 · Water ${this.flowers.length} flowers, then reach the gate`;
    this.hint =
      "A places a water balloon. Step away from its marked splash. B pops it early.";
    this.announce(spec.name);
  }
  blocked(x, y, balloons = true) {
    return (
      this.walls.has(cellKey(x, y)) ||
      this.crates.has(cellKey(x, y)) ||
      (balloons && this.balloons.some((b) => b.x === x && b.y === y))
    );
  }
  splashCells(balloon) {
    const cells = [{ x: balloon.x, y: balloon.y }];
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ])
      for (let n = 1; n <= 2; n++) {
        const x = balloon.x + dx * n,
          y = balloon.y + dy * n;
        if (this.walls.has(cellKey(x, y))) break;
        cells.push({ x, y });
        if (this.crates.has(cellKey(x, y))) break;
      }
    return cells;
  }
  place() {
    if (
      this.balloons.length >= 3 ||
      this.balloons.some((b) => b.x === this.cell.x && b.y === this.cell.y)
    )
      return;
    this.balloons.push({ ...this.cell, fuse: this.gentle ? 2.8 : 2.2 });
    this.balloonCount++;
    this.actionTime = 0.25;
    this.cue("bubble");
  }
  pop(balloon) {
    if (!this.balloons.includes(balloon)) return;
    this.balloons = this.balloons.filter((b) => b !== balloon);
    const cells = this.splashCells(balloon);
    this.splashes.push({ cells, life: 0.5 });
    this.cue("splash");
    for (const c of cells) {
      const key = cellKey(c.x, c.y);
      if (this.crates.delete(key)) {
        this.score += 10;
        const xy = center(c.x, c.y);
        this.burst(xy.x, xy.y, "#c4e1a2", null);
      }
      const flower = this.flowers.find((f) => f.x === c.x && f.y === c.y);
      if (flower && !flower.wet) {
        flower.wet = true;
        this.flowersWatered++;
        this.score += 100;
        const xy = center(c.x, c.y);
        this.burst(xy.x, xy.y, "#ffd6ac", "pickup");
      }
      const next = this.balloons.find((b) => b.x === c.x && b.y === c.y);
      if (next) this.pop(next);
    }
  }
  move(dx, dy) {
    const x = this.cell.x + dx,
      y = this.cell.y + dy;
    if (this.blocked(x, y)) return false;
    this.cell = { x, y };
    Object.assign(this.player, center(x, y));
    return true;
  }
  update(dt, input) {
    if (this.done || this.failed) return;
    this.tick(dt);
    this.inv = Math.max(0, this.inv - dt);
    this.stepTimer = Math.max(0, this.stepTimer - dt);
    const dx = Math.abs(input.x) >= Math.abs(input.y) ? Math.sign(input.x) : 0,
      dy = dx ? 0 : Math.sign(input.y),
      dir = dx
        ? dx > 0
          ? "right"
          : "left"
        : dy
          ? dy > 0
            ? "down"
            : "up"
          : "";
    if (dir) {
      this.direction = dir;
      this.player.face = dx || this.player.face;
      if (this.stepTimer === 0 || dir !== this.lastDir) {
        this.move(dx, dy);
        this.stepTimer = 0.15;
      }
    } else this.stepTimer = 0;
    this.lastDir = dir;
    if (input.pressed.a) this.place();
    if (input.pressed.b && this.balloons.length) this.pop(this.balloons[0]);
    for (const b of [...this.balloons]) {
      b.fuse -= dt;
      if (b.fuse <= 0) this.pop(b);
    }
    for (const s of this.splashes) {
      s.life -= dt;
      if (
        this.inv <= 0 &&
        s.cells.some((c) => c.x === this.cell.x && c.y === this.cell.y)
      ) {
        this.inv = 1.4;
        this.cue("hurt");
        if (this.gentle) this.announce("Splash! Your flowers are safe.");
        else {
          this.hearts--;
          this.announce("Step around the splash marks.");
          if (this.hearts <= 0) this.failed = true;
        }
      }
    }
    this.splashes = this.splashes.filter((s) => s.life > 0);
    this.renderPlayer.x +=
      (this.player.x - this.renderPlayer.x) * Math.min(1, dt * 24);
    this.renderPlayer.y +=
      (this.player.y - this.renderPlayer.y) * Math.min(1, dt * 24);
    const blocked = [
      ...this.walls,
      ...this.crates,
      ...this.balloons.map((b) => cellKey(b.x, b.y)),
    ].map((k) => {
      const [x, y] = k.split(",").map(Number);
      return { ...center(x, y), w: CELL - 3, h: CELL - 3 };
    });
    this.stepBean(dt, blocked);
    const wet = this.flowers.filter((f) => f.wet).length;
    this.message = `${wet}/${this.flowers.length} flowers · ${this.score} points${this.gentle ? "" : ` · ${this.hearts} hearts`}`;
    if (wet === this.flowers.length) {
      this.hint =
        "All flowers watered! Walk to the bright gate at the bottom right.";
      if (this.cell.x === this.exit.x && this.cell.y === this.exit.y) {
        if (this.room === SPLASH_ROOMS.length - 1) this.win();
        else {
          this.room++;
          this.hearts = Math.min(3, this.hearts + 1);
          this.loadRoom();
        }
      }
    }
  }
  stepBean(dt, walls) {
    const b = this.bean;
    b.clock = (b.clock || 0) + dt;
    const exploring = b.clock % 11 > 3 && b.clock % 11 < 5.5;
    const occupied = new Set([
      ...this.walls,
      ...this.crates,
      ...this.balloons.map((b) => cellKey(b.x, b.y)),
    ]);
    const start = {
      x: Math.round((b.x - OX - CELL / 2) / CELL),
      y: Math.round((b.y - OY - CELL / 2) / CELL),
    };
    occupied.delete(cellKey(start.x, start.y));
    const desired = {
      x: this.cell.x + (exploring ? 2 : -1) * this.player.face,
      y: this.cell.y + (exploring ? 0 : 1),
    };
    const choices = [];
    for (let y = 1; y < ROWS - 1; y++)
      for (let x = 1; x < COLS - 1; x++) {
        const distance = Math.abs(x - this.cell.x) + Math.abs(y - this.cell.y);
        if (distance >= 1 && distance <= 3 && !occupied.has(cellKey(x, y)))
          choices.push({ x, y });
      }
    choices.sort(
      (a, c) =>
        Math.hypot(a.x - desired.x, a.y - desired.y) -
        Math.hypot(c.x - desired.x, c.y - desired.y),
    );
    let path;
    for (const target of choices) {
      path = gridRoute(start, target, occupied, COLS, ROWS);
      if (path) break;
    }
    const next = path?.[1] || path?.[0];
    if (next)
      b.moveToward(
        dt,
        center(next.x, next.y),
        walls.filter((w) => !overlap({ x: b.x, y: b.y, w: 18, h: 18 }, w)),
        exploring ? "exploring" : "returning",
        145,
      );
    else {
      b.state = "waiting";
      b.moving = false;
      b.animate(dt);
    }
  }
  draw(p) {
    p.backdrop("splash");
    const ready = this.flowers.every((f) => f.wet);
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const at = center(x, y),
          key = cellKey(x, y);
        p.rect(
          at.x,
          at.y,
          CELL - 3,
          CELL - 3,
          (x + y) % 2 ? "#dfc995" : "#e8d5a5",
        );
        if (this.walls.has(key)) {
          p.rect(at.x, at.y, 51, 51, "#385b62");
          p.rect(at.x, at.y - 18, 45, 12, "#6f9b87");
          p.rect(at.x, at.y + 18, 45, 9, "#294750");
        } else if (this.crates.has(key)) {
          p.rect(at.x, at.y, 42, 42, "#5c8764");
          p.rect(at.x - 6, at.y - 9, 24, 15, "#9abd78");
          p.rect(at.x + 12, at.y + 6, 15, 24, "#719758");
          p.rect(at.x - 12, at.y + 15, 18, 6, "#41684e");
        }
      }
    const gate = center(this.exit.x, this.exit.y);
    p.rect(gate.x, gate.y, 42, 42, ready ? "#f9dc8d" : "#ae9f7e");
    p.rect(gate.x, gate.y, 24, 33, ready ? "#638f7d" : "#7b8270");
    if (ready) p.star(gate.x, gate.y, 9, "#fff1bf");
    for (const f of this.flowers) {
      const at = center(f.x, f.y);
      p.rect(at.x, at.y + 9, 30, 18, "#a96456");
      p.rect(at.x, at.y + 3, 36, 6, "#e29f71");
      p.line(at.x, at.y + 3, at.x, at.y - 15, 3, "#397b66");
      p.circle(at.x, at.y - 15, f.wet ? 12 : 6, f.wet ? "#ed95ac" : "#b18a85");
      if (f.wet) p.rect(at.x, at.y - 15, 6, 6, "#fff0b0");
    }
    for (const b of this.balloons) {
      const at = center(b.x, b.y);
      if (b.fuse < 1.2)
        for (const c of this.splashCells(b)) {
          const q = center(c.x, c.y);
          p.rect(q.x, q.y, 12, 3, "#78b9c7");
          p.rect(q.x, q.y, 3, 12, "#78b9c7");
        }
      p.circle(
        at.x,
        at.y - 3,
        15 + (b.fuse < 0.6 ? (Math.floor(this.t * 12) % 2) * 3 : 0),
        "#438bba",
      );
      p.circle(at.x - 3, at.y - 6, 9, "#94d7e0");
      p.rect(at.x - 6, at.y - 9, 6, 6, "#fff0d0");
      p.rect(at.x, at.y + 15, 6, 3, "#346b98");
    }
    for (const s of this.splashes)
      for (const c of s.cells) {
        const at = center(c.x, c.y);
        p.rect(at.x, at.y, 45, 30, "#80c5d0", 0, 0.7);
        p.rect(at.x, at.y, 30, 45, "#80c5d0", 0, 0.7);
        p.star(at.x, at.y, 9, "#d5f1df");
      }
    const actors = [
      {
        y: this.renderPlayer.y,
        draw: () =>
          this.drawHero(
            p,
            this.renderPlayer.x,
            this.renderPlayer.y + 5,
            0.65,
            this.player.face,
            this.inv > 0,
          ),
      },
    ];
    if (p.hero !== "bean")
      actors.push({ y: this.bean.y, draw: () => this.bean.draw(p) });
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
    this.effects(p);
  }
}
