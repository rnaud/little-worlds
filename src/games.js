import {
  paintRallyRoad,
  rallyRoad,
  rallyPose,
  rallyCamera,
  projectRallyPoint,
  projectRallyActor,
} from "./rally-art.js";
import { clamp, overlap, near, W, H } from "./engine.js";
import { BeanCompanion, clearSight } from "./companions.js";
import { ActorAnimation, directionalState } from "./animation.js";
import {
  SUMMIT_LEVELS,
  MEADOW_LEVELS,
  GARDEN_LEVELS,
  KEEPSAKES,
} from "./levels.js";
import { platformMotion } from "./platform-motion.js";
import { World } from "./world.js";
import { BubbleRescue, SplashMaze } from "./party-games.js";
export class Platformer extends World {
  constructor(kind, gentle, sound, level = 0) {
    super(gentle, sound);
    this.kind = kind;
    this.precision = kind === "summit";
    const levels = this.precision ? SUMMIT_LEVELS : MEADOW_LEVELS;
    this.level = clamp(Math.floor(level) || 0, 0, levels.length - 1);
    this.levelInfo = levels[this.level];
    this.need = this.levelInfo.need;
    this.camera = 0;
    this.deaths = 0;
    this.checkpoint = { x: 100, y: 400 };
    this.player = {
      x: 100,
      y: 400,
      w: 26,
      h: 54,
      vx: 0,
      vy: 0,
      ground: false,
      face: 1,
      dash: 1,
      wall: 0,
    };
    this.jumpBuffer = 0;
    this.coyote = 0;
    this.dashTime = 0;
    this.trail = [];
    this.finishX = this.levelInfo.finish[0];
    this.platforms = this.levelInfo.platforms;
    this.platforms = this.platforms.map(([x, y, w, h]) => ({
      x,
      y,
      w,
      h,
      oneWay: !this.precision && h <= 24,
    }));
    this.items = this.levelInfo.items.map(([x, y]) => ({ x, y, got: false }));
    this.hazards = this.precision
      ? []
      : this.levelInfo.enemies.map(([x, y]) => [x, y, 30, 28]);
    this.enemies = this.hazards.map(([x, y, w, h]) => ({
      x,
      y,
      w,
      h,
      base: x,
      alive: true,
    }));
    this.flag = this.precision ? { x: 2260, y: 252 } : { x: 2130, y: 435 };
    this.inv = 0;
    this.bean = new BeanCompanion(36, 418);
    this.jumpHeld = false;
    this.wallGrace = 0;
    this.lastWall = 0;
    this.springs = (this.levelInfo?.springs || []).map((s) => ({ ...s }));
    this.platforms.forEach((b) => {
      b.baseX = b.x;
      b.baseY = b.y;
      b.dx = 0;
      b.dy = 0;
    });
    for (const motion of this.levelInfo?.moving || [])
      Object.assign(this.platforms[motion.index], motion, { moving: true });
    for (const index of this.levelInfo?.crumbling || [])
      this.platforms[index].crumble = true;
    for (const item of this.items) {
      const index = this.platforms.findIndex(
        (b) =>
          b.moving &&
          Math.abs(b.x - item.x) < b.w / 2 &&
          Math.abs(b.y - 50 - item.y) < 20,
      );
      if (index >= 0) {
        item.platform = index;
        item.offsetX = item.x - this.platforms[index].x;
      }
    }
    if (this.levelInfo) {
      this.finishX = this.levelInfo.finish[0];
      this.flag = { x: this.finishX, y: this.levelInfo.finish[1] };
      this.objective = this.precision
        ? `Find ${this.need} stars and reach the flag · ${this.levelInfo.title}`
        : `Collect ${this.need} bananas, then reach the picnic · ${this.levelInfo.title}`;
    }
    this.checkpoints = (this.levelInfo.checkpoints || []).map(([x, y]) => ({
      x,
      y,
    }));
    this.checkpointSaved = false;
  }
  stepPlatforms(dt) {
    for (const b of this.platforms) {
      const oldX = b.x;
      if (b.moving) b.x = b.baseX + Math.sin(this.t * b.speed) * b.range;
      b.dx = b.x - oldX;
      if (b.hidden > 0) {
        b.hidden = Math.max(0, b.hidden - dt);
        if (b.hidden === 0) b.shake = null;
      } else if (b.shake != null) {
        b.shake -= dt;
        if (b.shake <= 0) {
          b.hidden = 3;
          this.dustBurst(b.x, b.y, 8);
        }
      }
    }
    for (const item of this.items)
      if (item.platform != null)
        item.x = this.platforms[item.platform].x + item.offsetX;
    for (const spring of this.springs)
      spring.flash = Math.max(0, (spring.flash || 0) - dt);
  }
  setBuddy(enabled, hero = "nur") {
    if (this.precision || !enabled) {
      this.buddy = null;
      return;
    }
    this.buddy = {
      hero,
      player: { ...this.player, x: this.player.x + 60, vx: 0, vy: 0 },
      actor: new ActorAnimation(),
      inv: 0,
      coyote: 0,
      jumpBuffer: 0,
      wallGrace: 0,
      lastWall: 0,
      dashTime: 0,
    };
  }
  recallBuddy() {
    const b = this.buddy;
    if (!b) return;
    const floor = this.platforms
      .filter((p) => !p.hidden && !p.crumble)
      .sort(
        (a, b) => Math.abs(a.x - this.player.x) - Math.abs(b.x - this.player.x),
      )[0];
    const x = clamp(
      this.player.x - 60,
      floor.x - floor.w / 2 + 35,
      floor.x + floor.w / 2 - 35,
    );
    Object.assign(b.player, {
      x,
      y: floor.y - floor.h / 2 - b.player.h / 2,
      vx: 0,
      vy: 0,
      ground: true,
      wall: 0,
    });
    b.coyote = 0;
    b.jumpBuffer = 0;
    b.wallGrace = 0;
    b.inv = 1;
    this.burst(x, b.player.y, "#a5d8e6");
  }
  respawn() {
    this.deaths++;
    Object.assign(this.player, {
      x: this.checkpoint.x,
      y: this.checkpoint.y,
      vx: 0,
      vy: 0,
      dash: 1,
    });
    this.dashTime = 0;
    this.coyote = 0;
    this.wallGrace = 0;
    this.jumpBuffer = 0;
    this.player.wall = 0;
    this.player.ground = false;
    this.announce("Back at the checkpoint. Your collectibles are safe.");
    this.inv = 1;
    this.cue("respawn", 220, 0.1);
  }
  update(dt, i) {
    const p = this.player;
    this.stepPlatforms(dt);
    this.tick(dt);
    this.inv = Math.max(0, this.inv - dt);
    if (platformMotion(this, dt, i, this, this.hero)) this.respawn();
    if (this.buddy) {
      const buddy = this.buddy,
        controls = i.second || {
          x: 0,
          y: 0,
          current: {},
          pressed: {},
          released: {},
        };
      buddy.inv = Math.max(0, buddy.inv - dt);
      buddy.offscreen =
        buddy.player.x < this.camera + 20 || buddy.player.x > this.camera + 940
          ? (buddy.offscreen || 0) + dt
          : 0;
      const fell = platformMotion(buddy, dt, controls, this, buddy.hero);
      if (
        fell ||
        controls.pressed.recall ||
        Math.abs(buddy.player.x - p.x) > 620 ||
        buddy.offscreen > 1.2
      )
        this.recallBuddy();
      buddy.actor.update(dt, {
        moving: Math.abs(buddy.player.vx) > 25,
        speed: Math.abs(buddy.player.vx),
        ground: buddy.player.ground,
        vy: buddy.player.vy,
        wall: !!buddy.player.wall,
        hurt: buddy.inv > 0.8,
      });
    }
    for (const point of this.checkpoints)
      if (
        p.ground &&
        Math.abs(p.x - point.x) < 65 &&
        Math.abs(p.y - point.y) < 12 &&
        this.checkpoint.x < point.x
      ) {
        this.checkpoint = { ...point };
        this.burst(point.x, point.y - 30, "#b9e8d1", "checkpoint");
        this.announce("Checkpoint! Your stars are safe.");
      }
    if (
      !this.precision &&
      p.ground &&
      Math.abs(p.x - this.levelInfo.checkpoint[0]) < 85 &&
      !this.checkpointSaved
    ) {
      this.checkpoint = {
        x: this.levelInfo.checkpoint[0],
        y: this.levelInfo.checkpoint[1],
      };
      this.checkpointSaved = true;
      this.burst(this.checkpoint.x, this.checkpoint.y, "#b9e8d1", "checkpoint");
      this.announce("Picnic checkpoint saved. Your bananas are safe!");
    }
    for (const b of this.items)
      if (
        !b.got &&
        [p, this.buddy?.player].some((actor) => actor && near(actor, b, 35))
      ) {
        b.got = true;
        this.score++;
        this.burst(b.x, b.y);
      }
    if (!this.precision)
      for (const e of this.enemies) {
        if (!e.alive) continue;
        e.x = e.base + Math.sin(this.t * 1.3 + e.base) * 30;
        for (const actor of [this, ...(this.buddy ? [this.buddy] : [])])
          if (e.alive && overlap(actor.player, e)) {
            const body = actor.player;
            if (body.vy > 0 && body.y < e.y - 8) {
              e.alive = false;
              body.vy = -370;
              this.burst(e.x, e.y, "#b9d7af");
            } else if (actor.inv <= 0) {
              if (this.gentle) {
                e.alive = false;
                actor.inv = 1;
                this.burst(e.x, e.y);
              } else if (actor === this) this.respawn();
              else this.recallBuddy();
            }
          }
      }
    const need = this.need;
    if (
      p.x > this.finishX - 25 &&
      this.score >= need &&
      p.ground &&
      Math.abs(p.y - this.flag.y) < 65
    )
      this.win();
    this.message =
      p.x > this.finishX - 80 && this.score < need
        ? `Find ${need - this.score} more ${this.precision ? "stars" : "bananas"} first`
        : `${Math.min(this.score, need)} / ${need} ${this.precision ? "stars" : "bananas"}${this.score > need ? ` · +${this.score - need} extra` : ""} · ${this.deaths} retries`;
    const cameraTarget = clamp(p.x - 330 + p.face * 35, 0, this.finishX - 750);
    this.camera += (cameraTarget - this.camera) * (1 - Math.exp(-7 * dt));
    this.bean.platformStep(dt, p, this.platforms, this.camera, this.checkpoint);
    this.hint =
      this.levelInfo.lesson + (this.precision ? "" : " Hold B to sprint.");
    if (this.score >= need)
      this.hint = this.precision
        ? "All stars collected! Land by the flag to finish."
        : "Enough bananas! Follow the arrow home to the cottage.";
    else if (p.x > this.finishX - 170)
      this.hint =
        "Missing collectibles? Follow the arrow back to the closest one.";
    this.trail = this.trail.filter((q) => (q.life -= dt) > 0);
  }
  draw(p) {
    const c = this.camera;
    p.backdrop(this.kind, c);
    for (const b of this.platforms) {
      if (b.hidden > 0) {
        if (b.hidden < 0.6)
          p.line(
            b.x - c - b.w / 2,
            b.y - b.h / 2,
            b.x - c + b.w / 2,
            b.y - b.h / 2,
            3,
            "#a5d8e6",
          );
        continue;
      }
      const x = b.x - c;
      if (!b.moving)
        p.platform(
          x + (b.shake != null ? Math.sin(this.t * 50) * 3 : 0),
          b.y,
          b.w,
          b.h,
          this.kind,
        );
      if (b.moving) {
        p.object("leaf-ferry", x, b.y + 9, {
          width: Math.round(b.w / 3),
          height: 16,
        });
        p.line(
          x - b.w / 2 + 8,
          b.y + 12,
          x + b.w / 2 - 8,
          b.y + 12,
          3,
          "#234b50",
        );
      }
      if (b.crumble)
        for (let crack = -b.w / 2 + 24; crack < b.w / 2; crack += 40) {
          p.line(x + crack, b.y - 9, x + crack + 7, b.y, 3, "#795662");
          p.line(x + crack + 7, b.y, x + crack + 2, b.y + 8, 3, "#795662");
        }
    }
    for (const spring of this.springs) {
      const x = spring.x - c,
        y = spring.y;
      p.object("flower-spring", x, y - 24, {
        width: 24,
        height: spring.flash > 0 ? 16 : 20,
      });
    }
    if (this.precision) {
      for (const point of this.checkpoints)
        p.object(
          "beacon",
          point.x - c,
          point.y - 20,
          0.65,
          this.checkpoint.x >= point.x ? 1 : 0.65,
        );
      // Two chevrons identify the deliberate dash gaps, not decoration.
      for (const [x, y] of this.levelInfo.dashSigns) {
        p.line(x - c, y - 12, x - c + 18, y, 6, "#f8e9ac");
        p.line(x - c + 18, y, x - c, y + 12, 6, "#f8e9ac");
      }
    }
    for (const b of this.items)
      if (!b.got) {
        if (this.precision)
          p.star(b.x - c, b.y + Math.sin(this.t * 3 + b.x) * 4, 14);
        else
          p.object(
            "bananas",
            b.x - c,
            b.y + Math.sin(this.t * 3 + b.x) * 4,
            0.8,
          );
      }
    if (!this.precision) {
      for (const e of this.enemies)
        if (e.alive) {
          p.creature(
            "leaf-slime",
            e.x - c,
            e.y - 9,
            this.t + e.base,
            0.72,
            Math.cos(this.t + e.base) < 0,
          );
        }
      p.object("cottage", this.finishX - c - 15, 379);
      p.object("picnic-basket", this.finishX - c + 70, 416, 0.7);
    }
    p.object(
      "goal-flag",
      this.flag.x - c + (this.precision ? 20 : 60),
      this.flag.y - 45 + (this.precision ? 8 : 3),
    );
    for (const q of this.trail)
      p.person(
        q.x - c,
        q.y + this.player.h / 2 - 15.3,
        0.85,
        this.t,
        this.player.face,
        true,
        p.hero,
        "dash",
      );
    this.drawHero(
      p,
      this.player.x - c,
      this.player.y + this.player.h / 2 - 15.3,
      0.85,
      this.player.face,
      this.inv > 0,
    );
    if (this.buddy) {
      const b = this.buddy,
        body = b.player;
      p.person(
        body.x - c,
        body.y + body.h / 2 - 15.3,
        0.85,
        b.actor.time,
        body.face,
        b.inv > 0,
        b.hero,
        this.done ? "celebrate" : b.actor.state,
      );
      p.rect(body.x - c, body.y + body.h / 2 + 3, 24, 3, "#a5d8e6");
    }
    if (this.precision && this.player.dash > 0)
      p.star(this.player.x - c, this.player.y - 43, 5, "#a0e1dc");
    if (p.hero !== "nur" && this.buddy?.hero !== "nur")
      p.person(
        178 - c,
        this.platforms[0].y - this.platforms[0].h / 2 - 15.3,
        0.85,
        this.t,
        1,
        false,
        "nur",
      );
    if (p.hero !== "arnaud" && this.buddy?.hero !== "arnaud")
      p.person(
        this.finishX - c - 60,
        (this.precision ? this.flag.y : 438) - 15.3,
        0.85,
        this.t,
        1,
        false,
        "arnaud",
      );
    this.bean.draw(p, c);
    const goal =
      this.score >= this.need
        ? this.flag
        : this.items
            .filter((b) => !b.got)
            .sort(
              (a, b) =>
                Math.abs(a.x - this.player.x) - Math.abs(b.x - this.player.x),
            )[0] || this.flag;
    if (this.gentle || this.score >= this.need)
      p.marker(clamp(goal.x - c, 35, 925), Math.max(90, goal.y - 42));
    if (!this.precision) {
      const [cx, cy] = this.levelInfo.checkpoint;
      p.line(cx - c, cy + 21, cx - c, cy - 31, 3, "#fff0af");
      p.rect(
        cx + 12 - c,
        cy - 26,
        22,
        13,
        this.checkpointSaved ? "#8fd286" : "#c67c92",
      );
    }
    this.effects(p, c);
  }
}
export class Forest extends World {
  constructor(g, s) {
    super(g, s);
    this.player = { x: 100, y: 400, w: 24, h: 28 };
    this.bean = new BeanCompanion(70, 430);
    this.facing = 1;
    this.direction = "down";
    this.key = false;
    this.open = false;
    this.inv = 0;
    this.swing = 0;
    this.cool = 0;
    this.health = 5;
    this.shrine = { x: 110, y: 410 };
    this.keyPos = { x: 120, y: 130 };
    this.lanterns = [
      { x: 404, y: 115 },
      { x: 803, y: 113 },
      { x: 817, y: 408 },
    ];
    this.walls = [
      { x: 480, y: 155, w: 34, h: 250 },
      { x: 480, y: 437, w: 34, h: 206 },
      { x: 277, y: 244, w: 130, h: 34 },
      { x: 709, y: 254, w: 170, h: 34 },
    ];
    this.gate = { x: 480, y: 307, w: 34, h: 54 };
    this.enemies = [
      { x: 280, y: 133, base: 280, alive: true },
      { x: 705, y: 400, base: 705, alive: true },
      { x: 802, y: 164, base: 802, alive: true },
    ];
    this.discoveries = KEEPSAKES.map((s) => ({ ...s, found: false }));
    this.sniffTarget = null;
    this.sniffTime = 0;
    this.shortcut = false;
  }
  findKeepsake(secret) {
    secret.found = true;
    this.sniffTarget = null;
    this.sniffTime = 0;
    this.health = Math.min(5, this.health + 1);
    this.burst(secret.x, secret.y, "#a5d8e6", "plant");
    this.announce(
      `${this.hero === "bean" ? "You" : "Bean"} found ${secret.title}! Saved in the family album.`,
    );
  }
  discoveryStep(dt, input, walls) {
    const p = this.player;
    this.nearSecret = this.discoveries.find(
      (s) =>
        !s.found &&
        near(p, s, this.hero === "bean" ? 70 : 120) &&
        clearSight(p, s, walls),
    );
    if (input.pressed.a && this.nearSecret && this.sniffTarget == null) {
      if (this.hero === "bean") this.findKeepsake(this.nearSecret);
      else if (clearSight(this.bean, this.nearSecret, walls)) {
        this.sniffTarget = this.discoveries.indexOf(this.nearSecret);
        this.sniffTime = 0;
        this.announce(
          "Bean caught a scent. Stay nearby while he investigates!",
        );
      }
    }
    const secret = this.discoveries[this.sniffTarget];
    if (secret && !secret.found) {
      if (!near(p, secret, 180)) {
        this.sniffTarget = null;
        this.sniffTime = 0;
      } else {
        this.bean.moveToward(dt, secret, walls, "following a scent", 145);
        if (near(this.bean, secret, 12)) {
          this.bean.actor.update(dt, { state: "sniff" });
          this.sniffTime += dt;
          if (this.sniffTime > 0.7) this.findKeepsake(secret);
        }
      }
    } else this.bean.forestStep(dt, p, walls);
    if (
      !this.shortcut &&
      this.open &&
      this.discoveries.filter((s) => s.found).length >= 2
    ) {
      this.shortcut = true;
      this.walls.splice(
        0,
        1,
        { x: 480, y: 82.5, w: 34, h: 105 },
        { x: 480, y: 240, w: 34, h: 80 },
      );
      this.burst(480, 168, "#86c88b");
      this.announce(
        "The roots made a new path! A shortcut is open in the north.",
      );
    }
  }
  update(dt, i) {
    this.tick(dt);
    this.inv -= dt;
    this.swing = Math.max(0, this.swing - dt);
    this.cool = Math.max(0, this.cool - dt);
    const p = this.player;
    let speed = i.current.b ? 260 : 175,
      dx = i.x,
      dy = i.y,
      n = Math.hypot(dx, dy) || 1;
    let walls = this.open ? this.walls : [...this.walls, this.gate];
    for (const axis of ["x", "y"]) {
      const old = p[axis];
      p[axis] += ((axis === "x" ? dx : dy) / n) * speed * dt;
      if (walls.some((w) => overlap(p, w))) p[axis] = old;
    }
    p.x = clamp(p.x, 45, 915);
    p.y = clamp(p.y, 78, 493);
    if (i.x) this.facing = i.x;
    if (Math.abs(i.y) > Math.abs(i.x)) this.direction = i.y < 0 ? "up" : "down";
    else if (i.x) this.direction = "side";
    this.discoveryStep(dt, i, walls);
    if (i.pressed.a && this.cool <= 0) {
      this.swing = 0.24;
      this.cool = 0.38;
      this.cue("wand", 500, 0.08);
    }
    if (!this.key && near(p, this.keyPos, 32)) {
      this.key = true;
      this.announce("Key found! The gate is east of here.");
      this.burst(p.x, p.y);
    }
    if (this.key && !this.open && near(p, this.gate, 64)) {
      this.open = true;
      this.announce("Gate open. Find the remaining lanterns.");
      this.burst(480, 308);
    }
    for (const l of this.lanterns)
      if (!l.got && near(p, l, 30)) {
        l.got = true;
        this.score++;
        this.burst(l.x, l.y);
      }
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.x = e.base + Math.sin(this.t * 1.5 + e.base) * 42;
      if (this.swing > 0 && near(p, e, 70) && clearSight(p, e, walls)) {
        e.alive = false;
        this.burst(e.x, e.y, "#b9d4a1");
      } else if (near(p, e, 28) && this.inv <= 0) {
        this.inv = 1.5;
        if (!this.gentle) this.health--;
        this.cue("bump", 190, 0.12);
        if (this.health <= 0) {
          this.failed = true;
          this.message = "The woods are ready for another try.";
          return;
        }
      }
    }
    if (this.score === 3 && near(p, this.shrine, 45)) this.win();
    this.objective =
      this.score === 3
        ? "Return all 3 lanterns to Nur’s shrine"
        : !this.key
          ? "Find the golden key in the northwest"
          : !this.open
            ? "Unlock the gate in the middle of the woods"
            : "Find the remaining lanterns";
    this.hint =
      this.sniffTarget != null
        ? "Bean is investigating. Stay nearby to see what he finds."
        : this.nearSecret && !this.nearSecret.found
          ? this.hero === "bean"
            ? "Something smells interesting! Press A to sniff it out."
            : "Bean caught a scent! Press A to ask him to investigate the ferns."
          : this.score === 3
            ? "The shrine is glowing in the southwest. Bring the light home."
            : "A swings your wand. Look for pawprints: Bean can sniff out hidden keepsakes.";
    this.message = `${this.score} / 3 lanterns · ${this.discoveries.filter((s) => s.found).length} / 3 keepsakes${this.gentle ? "" : ` · ${this.health} hearts`}`;
  }
  draw(p) {
    p.backdrop("forest");
    p.terrain(475, 306, 800, 44, "moss");
    p.terrain(115, 286, 44, 347, "moss");
    p.terrain(819, 283, 44, 345, "moss");
    if (this.shortcut) p.terrain(480, 168, 130, 60, "moss");
    for (const w of this.walls) {
      p.terrain(w.x, w.y, w.w, w.h, "root");
    }
    if (!this.open) {
      p.object("root-gate", 480, 301, 0.8);
    }
    for (const secret of this.discoveries) {
      if (secret.found) p.object(secret.object, secret.x, secret.y - 10, 0.65);
      else {
        p.object("flora-fern", secret.x, secret.y - 23, 0.55);
        if (near(this.player, secret, 130)) {
          for (let paw = 0; paw < 3; paw++) {
            const x = secret.x - 25 + paw * 13,
              y = secret.y + 15 + (paw % 2) * 7;
            p.circle(x, y, 3, "#ffcc83");
            p.rect(x - 3, y - 5, 3, 3, "#ffcc83");
            p.rect(x + 3, y - 5, 3, 3, "#ffcc83");
          }
        }
      }
    }
    if (this.discoveries.every((s) => s.found))
      p.object("dog-biscuit", this.shrine.x + 58, this.shrine.y + 15, 0.6);
    p.object("shrine", this.shrine.x, this.shrine.y - 25, 0.8);
    if (this.score === 3)
      p.star(this.shrine.x, this.shrine.y - 70, 9, "#fff1a1");
    if (!this.key) {
      p.object("woodland-key", 120, 130 + Math.sin(this.t * 2) * 3, 0.7);
    }
    for (const l of this.lanterns)
      if (!l.got) {
        p.object(
          "amber-lantern",
          l.x,
          l.y + Math.sin(this.t * 2 + l.x) * 2,
          0.8,
        );
        if (Math.floor(this.t * 3 + l.x) % 3 === 0)
          p.star(l.x + 18, l.y - 18, 4, "#ffe6a1");
      }
    // Sort by the point touching the ground so walking behind family members
    // or Bean changes overlap naturally instead of always painting Gaia last.
    const actors = this.enemies
      .filter((e) => e.alive)
      .map((e) => ({
        feet: e.y + 15,
        draw: () =>
          p.creature(
            "fern-spirit",
            e.x,
            e.y - 9,
            this.t + e.base,
            0.72,
            Math.cos(this.t * 1.5 + e.base) > 0,
          ),
      }));
    for (const [id, x, y] of [
      ["nur", 155, 435],
      ["arnaud", 845, 365],
    ]) {
      if (p.hero === id) continue;
      actors.push({
        feet: y + 16,
        draw: () =>
          p.person(
            x,
            y,
            0.9,
            this.presentationTime + (id === "arnaud" ? 0.4 : 0),
            this.player.x < x ? -1 : 1,
            false,
            id,
            this.done ? "celebrate" : "idle",
          ),
      });
    }
    if (p.hero !== "bean")
      actors.push({ feet: this.bean.y + 14, draw: () => this.bean.draw(p) });
    actors.push({
      feet: this.player.y + 15,
      draw: () =>
        this.drawHero(
          p,
          this.player.x,
          this.player.y,
          0.82,
          this.facing,
          this.inv > 0,
        ),
    });
    for (const actor of actors.sort((a, b) => a.feet - b.feet)) actor.draw();
    const target =
      this.score === 3
        ? this.shrine
        : !this.key
          ? this.keyPos
          : !this.open
            ? this.gate
            : this.lanterns.find((l) => !l.got);
    if (target && (this.gentle || this.score === 3))
      p.marker(target.x, target.y - 38);
    if (this.swing > 0) {
      p.circle(this.player.x, this.player.y, 65, "#fff5c2", 0.22);
      for (let k = 0; k < 7; k++)
        p.star(
          this.player.x + Math.cos(k) * 55,
          this.player.y + Math.sin(k) * 55,
          8,
        );
    }
    this.effects(p);
  }
}
export class Rally extends World {
  constructor(g, s) {
    super(g, s);
    this.companionMode = "rally";
    this.player = { x: 480, y: 424, w: 40, h: 60 };
    this.distance = 0;
    this.speed = 0;
    this.spawn = 0;
    this.objects = [];
    this.inv = 0;
    this.bump = 0;
    this.fuel = 1;
    this.countdown = 1.5;
    this.nextMilestone = 600;
    this.rivals = [
      { distance: 18, lane: -88, pace: 212 },
      { distance: 42, lane: 86, pace: 248 },
    ];
    this.place = 3;
  }
  road(y) {
    return rallyRoad(this.distance, y);
  }
  update(dt, i) {
    this.tick(dt);
    if (this.countdown > 0) {
      this.countdown -= dt;
      this.message = "Ready… " + Math.max(1, Math.ceil(this.countdown));
      this.hint = "Steer with left/right. A boosts; B brakes.";
      return;
    }
    this.inv -= dt;
    this.bump -= dt;
    const boost = i.current.a && this.fuel > 0,
      brake = i.current.b || i.current.down;
    this.steer = i.x;
    this.boosting = boost;
    this.fuel = clamp(this.fuel + (boost ? -0.27 : 0.13) * dt, 0, 1);
    const target = this.bump > 0 ? 70 : brake ? 100 : boost ? 370 : 240;
    this.speed += (target - this.speed) * dt * 3;
    this.distance += this.speed * dt * 0.35;
    for (let n = 0; n < this.rivals.length; n++) {
      const rival = this.rivals[n];
      rival.distance +=
        (rival.pace + Math.sin(this.t * 0.8 + n * 2) * 14) * dt * 0.35;
      rival.lane = (n ? 86 : -88) + Math.sin(this.t * 0.65 + n) * 22;
    }
    this.place =
      1 + this.rivals.filter((rival) => rival.distance > this.distance).length;
    this.player.x = clamp(this.player.x + i.x * 300 * dt, 180, 780);
    const center = this.road(424);
    if (Math.abs(this.player.x - center) > 160) {
      this.speed *= Math.exp(-2.4 * dt);
      if (this.gentle) this.player.x += (center - this.player.x) * dt * 1.4;
    }
    this.spawn -= dt;
    if (this.spawn <= 0) {
      this.spawn = this.gentle ? 1.15 : 0.8;
      const banana = Math.floor(this.t * 4) % 3 === 0;
      this.objects.push({
        x: this.road(-40) + Math.sin(this.t * 7) * 115,
        laneOffset: Math.sin(this.t * 7) * 115,
        y: -40,
        w: banana ? 26 : 58,
        h: banana ? 26 : 30,
        banana,
      });
    }
    for (const o of this.objects) {
      o.y += this.speed * dt;
      o.x = this.road(o.y) + (o.laneOffset || 0);
      if (overlap(this.player, o) && !o.hit) {
        o.hit = true;
        if (o.banana) {
          this.score++;
          this.fuel = clamp(this.fuel + 0.18, 0, 1);
          this.burst(o.x, o.y);
        } else if (this.inv <= 0) {
          this.bump = this.gentle ? 0.5 : 1.2;
          this.inv = 1;
          this.cue("bump", 170, 0.16);
        }
      }
    }
    this.objects = this.objects.filter((o) => o.y < 580 && !o.hit);
    if (this.distance >= this.nextMilestone && this.nextMilestone < 1800) {
      this.announce(`${this.nextMilestone} m! Keep going.`);
      this.nextMilestone += 600;
    }
    this.hint =
      this.bump > 0
        ? "Splash! You’ll be back up to speed in a moment."
        : Math.abs(this.player.x - center) > 160
          ? "Off road! Steer back between the white lines."
          : "Bananas refill boost. Keep a clear lane around the puddles.";
    if (this.distance >= 1800) this.win();
    this.message = `${this.place === 1 ? "1st" : this.place === 2 ? "2nd" : "3rd"} · ${Math.min(1800, Math.floor(this.distance))} / 1,800 m · Boost ${Math.round(this.fuel * 100)}%`;
  }
  // A flat world projected scanline by scanline: SNES-style Mode 7 perspective.
  project(x, y) {
    return projectRallyActor(
      this.distance,
      this.player.x - this.road(424),
      x,
      y,
    );
  }
  draw(p) {
    p.begin("#b8d8d5");
    if (!this.roadCanvas) {
      this.roadCanvas = document.createElement("canvas");
      this.roadCanvas.width = 320;
      this.roadCanvas.height = 180;
    }
    paintRallyRoad(
      this.roadCanvas.getContext("2d"),
      this.distance,
      this.player.x - this.road(424),
    );
    const texture = p.texture("rally:mode7", this.roadCanvas);
    texture.image = this.roadCanvas;
    texture.needsUpdate = true;
    p.shape("rect", 480, 270, 960, 540, "#ffffff", 0, 1, texture);
    // Everything shares the same projection, including Bean's independent kart.
    const actors = [];
    const camera = rallyCamera(this.distance, this.player.x - this.road(424));
    for (let n = 0; n < 40; n++) {
      const pose = rallyPose((n * 1800) / 40);
      const offset = n % 2 ? 245 : -245;
      const q = projectRallyPoint(
        camera,
        pose.x + pose.rx * offset,
        pose.y + pose.ry * offset,
      );
      if (q.depth > 40 && q.y > 174 && q.y < 570 && q.x > -100 && q.x < 1060)
        actors.push({
          depth: q.depth,
          draw: () => {
            const size = Math.max(2, Math.round(q.scale * 9));
            p.rect(
              q.x,
              q.y - size * 2,
              Math.max(3, size * 0.45),
              size * 4,
              "#735b52",
            );
            p.circle(q.x, q.y - size * 4, size * 2, "#426e65");
            p.circle(q.x - size * 0.7, q.y - size * 4.7, size * 1.3, "#648e74");
          },
        });
    }
    for (const o of this.objects) {
      const q = this.project(o.x, o.y);
      if (q.depth <= 40 || q.y > 565) continue;
      actors.push({
        depth: q.depth,
        draw: () => {
          if (o.banana)
            p.object("bananas", q.x, q.y - 10 * q.scale, {
              width: Math.max(5, Math.round(10 * q.scale)),
              height: Math.max(5, Math.round(10 * q.scale)),
            });
          else {
            p.shape("circle", q.x, q.y, 58 * q.scale, 22 * q.scale, "#284e72");
            p.shape(
              "circle",
              q.x - 5 * q.scale,
              q.y - 2 * q.scale,
              32 * q.scale,
              7 * q.scale,
              "#a6d5d8",
            );
          }
        },
      });
    }
    const addKart = (id, x, y, steer, boost, small, alpha = 1) => {
      const q = this.project(x, y);
      if (q.depth <= 40) return;
      actors.push({
        depth: q.depth,
        draw: () => {
          p.shape(
            "circle",
            q.x,
            q.y + 18 * q.scale,
            44 * q.scale,
            10 * q.scale,
            "#384a54",
          );
          p.kart(id, q.x, q.y, steer, boost, small, alpha, q.scale / 1.5);
        },
      });
    };
    const family = ["nur", "arnaud", "gaia"].filter((id) => id !== p.hero);
    for (let n = 0; n < this.rivals.length; n++) {
      const rival = this.rivals[n],
        gap = rival.distance - this.distance;
      if (gap < -18 || gap > 240) continue;
      const y = 424 - gap / 0.35;
      addKart(
        family[n],
        this.road(y) + rival.lane,
        y,
        Math.sin(this.t * 0.65 + n),
        false,
        false,
      );
    }
    addKart(
      p.hero,
      this.player.x,
      this.player.y,
      this.steer,
      this.boosting,
      false,
      this.inv > 0 && Math.floor(this.t * 12) % 2 ? 0.45 : 1,
    );
    if (this.bean && p.hero !== "bean")
      addKart(
        "bean",
        this.bean.x,
        this.bean.y,
        this.bean.moving ? this.bean.face : 0,
        this.bean.state === "exploring",
        true,
      );
    for (const a of actors.sort((a, b) => b.depth - a.depth)) a.draw();
    for (const particle of this.particles) {
      const q = this.project(particle.x, particle.y);
      if (q.depth > 40 && q.y < 550)
        p.star(
          q.x,
          q.y - 15 * q.scale,
          Math.max(3, 6 * particle.life * q.scale),
          particle.c,
        );
    }
    if (this.boosting)
      for (const x of [45, 105, 855, 915])
        p.line(x, 400, x + (x < 480 ? -18 : 18), 460, 3, "#f5e8b8");
  }
}
export class Bricks extends World {
  constructor(g, s) {
    super(g, s);
    this.companionMode = "bricks";
    this.paddle = { x: 480, y: 474, w: g ? 160 : 118, h: 15 };
    this.ball = { x: 480, y: 450, vx: 160, vy: -250 };
    this.launched = false;
    this.lives = 5;
    this.bricks = Array.from({ length: 24 }, (_, k) => ({
      x: 134 + (k % 8) * 99,
      y: 105 + Math.floor(k / 8) * 39,
      w: 86,
      h: 25,
      alive: true,
      row: Math.floor(k / 8),
    }));
  }
  update(dt, i) {
    this.tick(dt);
    this.paddle.x = clamp(
      this.paddle.x + i.x * 480 * dt,
      50 + this.paddle.w / 2,
      910 - this.paddle.w / 2,
    );
    const b = this.ball;
    if (!this.launched) {
      b.x = this.paddle.x;
      b.y = 450;
      if (i.pressed.a) {
        this.launched = true;
        this.cue("launch");
      }
    } else {
      const factor = i.current.b ? 0.55 : 1;
      b.x += b.vx * dt * factor;
      b.y += b.vy * dt * factor;
      if (b.x < 55 || b.x > 905) {
        b.x = clamp(b.x, 55, 905);
        b.vx *= -1;
      }
      if (b.y < 65) {
        b.y = 65;
        b.vy = Math.abs(b.vy);
      }
      if (
        b.vy > 0 &&
        b.y > this.paddle.y - 16 &&
        b.y < this.paddle.y + 8 &&
        Math.abs(b.x - this.paddle.x) < this.paddle.w / 2 + 8
      ) {
        const offset = clamp(
          (b.x - this.paddle.x) / (this.paddle.w / 2),
          -1,
          1,
        );
        b.vx = offset * 290;
        if (Math.abs(b.vx) < 65)
          b.vx = (Math.sign(b.vx) || Math.sign(i.x) || 1) * 65;
        b.vy = -Math.sqrt(Math.max(190 ** 2, 330 ** 2 - b.vx ** 2));
        b.y = this.paddle.y - 17;
        this.cue("bounce", 390, 0.07);
      }
      for (const r of this.bricks)
        if (r.alive && overlap({ x: b.x, y: b.y, w: 16, h: 16 }, r)) {
          r.alive = false;
          const px = b.x - b.vx * dt * factor,
            py = b.y - b.vy * dt * factor;
          if (Math.abs(px - r.x) > r.w / 2 + 6) {
            b.x = r.x + Math.sign(px - r.x) * (r.w / 2 + 8);
            b.vx *= -1;
          } else {
            b.y = r.y + Math.sign(py - r.y) * (r.h / 2 + 8);
            b.vy *= -1;
          }
          this.score++;
          this.burst(r.x, r.y, ["#f4df9f", "#b8dbcb", "#d3b8d7"][r.row]);
          break;
        }
      if (b.y > 540) {
        this.launched = false;
        if (!this.gentle) this.lives--;
        b.vx = 160;
        b.vy = -250;
        if (this.lives <= 0) this.failed = true;
      }
      if (this.score === 24) this.win();
    }
    this.hint = !this.launched
      ? "Press A to launch. Hit with the paddle’s edge to change direction."
      : "Use the paddle’s edges to aim. Hold B to slow the ball.";
    this.message = `${this.score} / 24 stars${this.gentle ? " · Endless tries" : ` · ${this.lives} balls`}${this.launched ? "" : " · A to launch"}`;
  }
  draw(p) {
    p.backdrop("bricks");
    p.rect(42, 290, 4, 470, "#d7aa65");
    p.rect(918, 290, 4, 470, "#d7aa65");
    p.prop("gear", 60, 480);
    p.prop("gear", 900, 480);
    for (const b of this.bricks)
      if (b.alive) {
        p.rect(b.x, b.y + 4, b.w, b.h, "#555d80");
        p.rect(b.x, b.y, b.w, b.h, ["#dc9460", "#409d98", "#4d6dae"][b.row]);
        p.rect(b.x, b.y - b.h / 2 + 3, b.w - 6, 3, "#ffefd2");
        p.rect(b.x, b.y + b.h / 2 - 3, b.w - 6, 3, "#463454");
        p.star(b.x, b.y, 7, "#fff7db");
      }
    if (!this.launched) {
      p.line(
        this.ball.x,
        this.ball.y - 18,
        this.ball.x + 30,
        this.ball.y - 70,
        3,
        "#91c3bd",
      );
      p.marker(this.ball.x + 30, this.ball.y - 75);
    }
    p.star(this.ball.x, this.ball.y, 12);
    this.drawHero(p, this.paddle.x, 520, 0.85, 1);
    p.object("brass-paddle", this.paddle.x, this.paddle.y + 9, {
      width: Math.round(this.paddle.w / 3) + 2,
      height: 12,
    });
    this.bean?.draw(p);
    if (p.hero !== "arnaud")
      p.person(
        870,
        520,
        0.85,
        this.presentationTime,
        -1,
        false,
        "arnaud",
        "idle",
      );
    this.effects(p);
  }
}
export const GARDEN_MAP = [
  "#########",
  "#.......#",
  "#.......#",
  "#..$.$..#",
  "#...@$..#",
  "#.. . ..#",
  "#... ...#",
  "#########",
];
export class Garden extends World {
  constructor(g, s, level = 0) {
    super(g, s);
    this.level = clamp(Math.floor(level) || 0, 0, GARDEN_LEVELS.length - 1);
    this.levelInfo = GARDEN_LEVELS[this.level];
    this.companionMode = "garden";
    this.walls = new Set();
    this.levelInfo.map.forEach((r, y) =>
      [...r].forEach((c, x) => {
        if (c === "#") this.walls.add(`${x},${y}`);
      }),
    );
    this.initial = {
      player: { ...this.levelInfo.player },
      boxes: this.levelInfo.boxes.map((b) => ({ ...b })),
    };
    this.targets = this.levelInfo.targets.map((t) => ({ ...t }));
    this.objective = `Plant ${this.targets.length} ${this.targets.length === 1 ? "flower" : "flowers"} · ${this.levelInfo.title}`;
    this.history = [];
    this.moves = 0;
    this.repeat = 0;
    this.lastDir = "";
    this.reset();
  }
  reset() {
    this.player = { ...this.initial.player };
    this.boxes = this.initial.boxes.map((b) => ({ ...b }));
    this.history = [];
    this.moves = 0;
    this.done = false;
    this.resetHold = 0;
    this.resetArmed = true;
    this.deadlock = false;
    this.renderPlayer = { ...this.player };
    this.renderBoxes = this.boxes.map((b) => ({ ...b }));
    this.bean = null;
    this.facing = 1;
    this.direction = "down";
  }
  move(dx, dy) {
    this.direction = dy ? (dy < 0 ? "up" : "down") : "side";
    const p = this.player,
      x = p.x + dx,
      y = p.y + dy;
    if (this.walls.has(`${x},${y}`)) {
      this.announce("That is a hedge. Try another direction.");
      return false;
    }
    const box = this.boxes.find((b) => b.x === x && b.y === y);
    if (
      box &&
      (this.walls.has(`${x + dx},${y + dy}`) ||
        this.boxes.some((b) => b.x === x + dx && b.y === y + dy))
    )
      return false;
    this.history.push({
      player: { ...p },
      boxes: this.boxes.map((b) => ({ ...b })),
      moves: this.moves,
    });
    if (box) {
      box.x += dx;
      box.y += dy;
      this.cue(
        this.targets.some((t) => t.x === box.x && t.y === box.y)
          ? "plant"
          : "push",
        430,
        0.08,
      );
    }
    if (dx) this.facing = dx;
    if (box) this.actionTime = 0.22;
    p.x = x;
    p.y = y;
    this.moves++;
    return true;
  }
  undo() {
    const state = this.history.pop();
    if (state) {
      this.player = state.player;
      this.boxes = state.boxes;
      this.moves = state.moves;
      this.done = false;
      this.cue("undo");
    }
  }
  update(dt, i) {
    this.tick(dt);
    const blend = 1 - Math.exp(-30 * dt);
    this.renderPlayer.x += (this.player.x - this.renderPlayer.x) * blend;
    this.renderPlayer.y += (this.player.y - this.renderPlayer.y) * blend;
    this.boxes.forEach((b, index) => {
      const rendered = this.renderBoxes[index];
      rendered.x += (b.x - rendered.x) * blend;
      rendered.y += (b.y - rendered.y) * blend;
    });
    this.repeat -= dt;
    if (i.pressed.a) this.undo();
    if (i.current.b) {
      this.resetHold += dt;
      if (this.resetHold >= 0.8 && this.resetArmed) {
        this.reset();
        this.resetArmed = false;
        this.announce("Garden reset. Fresh start!");
      }
    } else {
      this.resetHold = 0;
      this.resetArmed = true;
    }
    const dir = i.x ? `${i.x},0` : i.y ? `0,${i.y}` : "";
    if (dir && (dir !== this.lastDir || this.repeat <= 0)) {
      const [dx, dy] = dir.split(",").map(Number);
      this.move(dx, dy);
      this.repeat = dir === this.lastDir ? 0.15 : 0.25;
    }
    this.lastDir = dir;
    this.score = this.targets.filter((t) =>
      this.boxes.some((b) => b.x === t.x && b.y === t.y),
    ).length;
    if (this.score === this.targets.length) this.win();
    this.deadlock = this.boxes.some(
      (b) =>
        !this.targets.some((t) => t.x === b.x && t.y === b.y) &&
        (this.walls.has(`${b.x - 1},${b.y}`) ||
          this.walls.has(`${b.x + 1},${b.y}`)) &&
        (this.walls.has(`${b.x},${b.y - 1}`) ||
          this.walls.has(`${b.x},${b.y + 1}`)),
    );
    this.hint =
      this.resetHold > 0
        ? "Keep holding B to reset (release to cancel)."
        : this.deadlock
          ? "A pot is trapped in a corner. Press A to undo your last push."
          : `${this.levelInfo.lesson} A undoes any move.`;
    this.message = `${this.score} / ${this.targets.length} flowers at home · ${this.moves} moves`;
  }
  draw(p) {
    p.backdrop("garden");
    const size = 54,
      ox = 264,
      oy = 80;
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 9; x++) {
        const wall = this.walls.has(`${x},${y}`),
          px = ox + x * size,
          py = oy + y * size;
        p.rect(
          px,
          py,
          size - 3,
          size - 3,
          wall ? "#915d54" : (x + y) % 2 ? "#dfc09b" : "#d2b38f",
        );
        if (wall) {
          p.terrain(px, py, size - 3, size - 3, "terracotta");
        }
      }
    for (const t of this.targets) {
      const x = ox + t.x * size,
        y = oy + t.y * size;
      const filled = this.boxes.some((b) => b.x === t.x && b.y === t.y);
      p.rect(x, y, 45, 45, filled ? "#67b483" : "#cc9c99");
      p.star(x, y, 14, "#f4ddbd");
    }
    const actors = this.boxes.map((b, index) => {
      const x = ox + this.renderBoxes[index].x * size,
        y = oy + this.renderBoxes[index].y * size;
      const home = this.targets.some((t) => t.x === b.x && t.y === b.y);
      return {
        y: y + 18,
        draw: () => p.object(home ? "gold-pot" : "pink-pot", x, y - 15, 0.85),
      };
    });
    actors.push({
      y: oy + this.renderPlayer.y * size + 14,
      draw: () =>
        this.drawHero(
          p,
          ox + this.renderPlayer.x * size,
          oy + this.renderPlayer.y * size,
          0.78,
          this.facing,
        ),
    });
    if (this.bean)
      actors.push({ y: this.bean.y + 14, draw: () => this.bean.draw(p) });
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
    if (p.hero !== "nur")
      p.person(143, 395, 1.2, this.presentationTime, 1, false, "nur", "idle");
    p.object("seedling-pot", 105, 474, 1.25);
    p.object("seedling-pot", 830, 474, 1.25);
  }
}
export class Space extends World {
  constructor(g, s) {
    super(g, s);
    this.companionMode = "space";
    this.player = { x: 150, y: 285, w: 45, h: 32 };
    this.bullets = [];
    this.enemies = [];
    this.wave = 0;
    this.cool = 0;
    this.inv = 0;
    this.health = 5;
    this.shield = 1;
    this.shieldActive = false;
    this.shieldLocked = false;
    this.intermission = 0;
    this.spawnWave();
  }
  spawnWave() {
    this.wave++;
    this.bullets = [];
    this.announce(`Wave ${this.wave} of 3`);
    this.enemies = Array.from({ length: 4 + this.wave }, (_, k) => ({
      x: 650 + (k % 3) * 95,
      y: 120 + Math.floor(k / 3) * 125,
      base: 120 + Math.floor(k / 3) * 125,
      w: 43,
      h: 43,
      hp: this.wave === 3 ? 2 : 1,
      shot: 1 + k * 0.35,
    }));
  }
  update(dt, i) {
    this.tick(dt);
    this.inv -= dt;
    this.cool -= dt;
    if (this.intermission > 0) {
      this.intermission -= dt;
      this.hint = "Wave clear! Next wave incoming…";
      if (this.intermission <= 0) this.spawnWave();
      return;
    }
    const norm = Math.hypot(i.x, i.y) || 1;
    this.player.x = clamp(this.player.x + (i.x / norm) * 245 * dt, 54, 440);
    this.player.y = clamp(this.player.y + (i.y / norm) * 245 * dt, 95, 495);
    if (this.shield >= 0.25) this.shieldLocked = false;
    const shield = !!i.current.b && this.shield > 0 && !this.shieldLocked;
    if (shield && !this.shieldActive) this.cue("shield");
    this.shieldActive = shield;
    this.shield = clamp(this.shield + (shield ? -0.35 : 0.13) * dt, 0, 1);
    if (this.shield <= 0) {
      this.shieldLocked = true;
      this.shieldActive = false;
    }
    if (i.current.a && this.cool <= 0) {
      this.cool = 0.19;
      this.bullets.push({
        x: this.player.x + 26,
        y: this.player.y,
        vx: 540,
        friend: true,
      });
      this.cue("shot", 800, 0.045);
    }
    this.firing = !!i.current.a;
    for (const e of this.enemies) {
      e.y = e.base + Math.sin(this.t * 1.8 + e.x) * 40;
      e.shot -= dt;
      if (e.shot <= 0) {
        e.shot = this.gentle ? 2.8 : 1.7;
        this.bullets.push({
          x: e.x - 25,
          y: e.y,
          vx: this.gentle ? -165 : -245,
          friend: false,
        });
      }
    }
    for (const b of this.bullets) {
      b.x += b.vx * dt;
      if (b.friend) {
        for (const e of this.enemies)
          if (e.hp > 0 && near(b, e, 28)) {
            e.hp--;
            b.dead = true;
            if (e.hp <= 0) {
              this.score++;
              this.burst(e.x, e.y, "#d5c1e8");
            }
            break;
          }
      } else if (near(b, this.player, shield ? 54 : 26)) {
        b.dead = true;
        if (shield) {
          this.burst(b.x, b.y, "#c2e9e2", "bounce");
        } else if (this.inv <= 0) {
          this.inv = 1;
          if (!this.gentle) this.health--;
          this.cue("bump", 190, 0.1);
          if (this.health <= 0) this.failed = true;
        }
      }
    }
    this.bullets = this.bullets.filter(
      (b) => !b.dead && b.x > -30 && b.x < 1000,
    );
    this.enemies = this.enemies.filter((e) => e.hp > 0);
    if (!this.enemies.length) {
      if (this.wave === 3) this.win();
      else {
        this.intermission = 1;
        this.bullets = [];
        this.shieldActive = false;
        this.announce("Wave clear! Take a breath.");
      }
    }
    this.hint = this.shieldLocked
      ? "Shield recharging. Dodge until it reaches 25%."
      : "Hold A to fire. Red orbs are dangerous; glowing rocks are about to shoot.";
    this.message = `Wave ${this.wave} / 3 · ${this.score} moon rocks · Shield ${Math.round(this.shield * 100)}%${this.gentle ? "" : ` · ${this.health} hearts`}`;
  }
  draw(p) {
    p.backdrop("space");
    for (let n = 0; n < 14; n++) {
      const x = (((n * 173 - this.t * 24) % 960) + 960) % 960;
      p.rect(x, 80 + ((n * 97) % 420), 6, 3, "#8c77aa");
    }
    for (const e of this.enemies) {
      p.creature("crystal-rock", e.x, e.y, this.t + e.x, 0.8);
      if (e.hp > 1) p.star(e.x + 21, e.y - 21, 6, "#b7f2e1");
      if (e.shot < 0.4) {
        p.marker(e.x, e.y - 37, "#f48a8e");
        p.circle(e.x - 29, e.y, 6, "#ff8a78");
      }
    }
    for (const b of this.bullets) {
      if (b.friend) p.star(b.x, b.y, 8);
      else {
        p.circle(b.x, b.y, 8, "#522d58");
        p.circle(b.x, b.y, 5, "#ff796f");
        p.rect(b.x, b.y, 3, 3, "#fff1d2");
      }
    }
    const x = this.player.x,
      y = this.player.y;
    const bob = [0, -3, 0, 3][Math.floor(this.presentationTime * 8) % 4];
    const alpha =
      this.inv > 0 && Math.floor(this.presentationTime * 12) % 2 ? 0.45 : 1;
    p.creature(
      "winged-unicorn",
      x,
      y + bob,
      this.presentationTime,
      0.85,
      false,
      alpha,
    );
    p.rider(
      p.hero,
      x + 3,
      y + 3 + bob,
      this.actor.time,
      this.actor.state,
      false,
      alpha,
    );
    if (this.bean && p.hero !== "bean") {
      p.creature(
        "winged-unicorn",
        this.bean.x,
        this.bean.y + 15,
        this.presentationTime + 0.22,
        0.65,
      );
      p.rider(
        "bean",
        this.bean.x + 2,
        this.bean.y + 17,
        this.presentationTime + 0.22,
        "ride",
        true,
      );
    }
    if (this.shieldActive) p.circle(x, y, 49, "#b8e7df", 0.16);
    this.effects(p);
  }
}
export function createGame(id, gentle, sound, options = {}) {
  switch (id) {
    case "summit":
    case "meadow":
      return new Platformer(id, gentle, sound, options.level);
    case "forest":
      return new Forest(gentle, sound);
    case "rally":
      return new Rally(gentle, sound);
    case "bricks":
      return new Bricks(gentle, sound);
    case "garden":
      return new Garden(gentle, sound, options.level);
    case "space":
      return new Space(gentle, sound);
    case "bubbles":
      return new BubbleRescue(gentle, sound);
    case "splash":
      return new SplashMaze(gentle, sound);
    default:
      throw Error(`Unknown game: ${id}`);
  }
}
