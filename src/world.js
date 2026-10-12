import { BeanCompanion } from "./companions.js";
import { ActorAnimation, directionalState } from "./animation.js";
export class World {
  constructor(gentle = false, sound = { play() {} }) {
    this.gentle = gentle;
    this.sound = sound;
    this.t = 0;
    this.done = false;
    this.failed = false;
    this.score = 0;
    this.particles = [];
    this.dust = [];
    this.hurtTime = 0;
    this.lastInv = 0;
    this.message = "";
    this.hint = "";
    this.notice = "";
    this.noticeTime = 0;
    this.actorTime = 0;
    this.actor = new ActorAnimation();
    this.presentationTime = 0;
    this.movementHold = 0;
    this.landingHold = 0;
    this.previousGround = false;
    this.actionTime = 0;
    this.lastPosition = null;
  }
  tick(dt) {
    this.t += dt;
    if (this.companionMode) {
      const mode = this.companionMode;
      let target = this.player || { x: 140, y: 380 };
      let bounds = { left: 30, right: 920, top: 60, bottom: 520 },
        walls = [];
      if (mode === "garden") {
        target = { x: 264 + this.player.x * 54, y: 80 + this.player.y * 54 };
        walls = [...this.walls].map((k) => {
          const [x, y] = k.split(",").map(Number);
          return { x: 264 + x * 54, y: 80 + y * 54, w: 54, h: 54 };
        });
        // Bean is a companion, not a puzzle piece: he never pushes or blocks pots.
      }
      if (mode === "bricks") {
        target = { x: this.paddle.x, y: 516 };
        bounds.top = 510;
      }
      if (mode === "rally") {
        bounds.left = this.road(424) - 135;
        bounds.right = this.road(424) + 135;
        bounds.top = 330;
        bounds.bottom = 450;
      }
      if (mode === "space") {
        bounds.right = 470;
        bounds.top = 95;
        bounds.bottom = 490;
      }
      this.bean ||= new BeanCompanion(target.x - 45, target.y + 20);
      if (mode === "garden")
        this.bean.gardenStep(
          dt,
          this.player,
          this.walls,
          this.boxes,
          this.facing,
        );
      else this.bean.roamStep(dt, target, bounds, walls);
    }
    this.noticeTime = Math.max(0, this.noticeTime - dt);
    const position = this.player || this.paddle;
    const distance =
      position && this.lastPosition
        ? Math.hypot(
            position.x - this.lastPosition.x,
            position.y - this.lastPosition.y,
          )
        : 0;
    this.movementHold =
      distance > 0.05 ? 0.12 : Math.max(0, this.movementHold - dt);
    this.actorTime = this.movementHold > 0 ? this.actorTime + dt : 0;
    if (position) this.lastPosition = { x: position.x, y: position.y };
    const grounded = this.player?.ground ?? true;
    if (grounded && !this.previousGround && this.player?.vy !== undefined) {
      this.landingHold = 0.085;
      this.dustBurst(this.player.x, this.player.y + this.player.h / 2);
    }
    this.previousGround = grounded;
    this.landingHold = Math.max(0, this.landingHold - dt);
    this.actionTime = Math.max(0, this.actionTime - dt);
    this.presentationTime += dt;
    const inv = this.inv || 0;
    if (inv > this.lastInv + 0.2) this.hurtTime = 0.18;
    this.lastInv = inv;
    this.hurtTime = Math.max(0, this.hurtTime - dt);
    this.actor.update(dt, {
      moving: this.movementHold > 0,
      speed: Math.abs(this.player?.vx || distance / dt),
      ground: grounded,
      vy: this.player?.vy || 0,
      wall: !!this.player?.wall,
      land: this.landingHold > 0,
      dash: this.dashTime > 0,
      hurt: this.hurtTime > 0,
      action: this.swing > 0 || this.actionTime > 0,
      celebrate: this.done,
      ride: this.companionMode === "space",
      ...(this.companionMode === "space"
        ? {
            state:
              this.hurtTime > 0
                ? "rideHurt"
                : this.firing
                  ? "rideAction"
                  : "ride",
          }
        : {}),
      ...((this.companionMode === "garden" || this.kind === "splash") &&
      this.actionTime > 0
        ? { state: "push" }
        : {}),
      ...(this.companionMode === "bricks"
        ? { state: this.movementHold > 0 ? "carry" : "carryIdle" }
        : {}),
    });
    const stepFrame = this.actor.frame(this.hero || "gaia");
    if (
      this.player?.ground &&
      Math.abs(this.player.vx) > 50 &&
      this.actor.state === "run" &&
      stepFrame !== this.lastFootFrame &&
      [4, 6].includes(stepFrame)
    )
      this.dustBurst(
        this.player.x - (this.player.face || 1) * 10,
        this.player.y + this.player.h / 2,
        2,
      );
    this.lastFootFrame = stepFrame;
    this.stepEffects(dt);
  }
  stepEffects(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.vy += 70 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const d of this.dust) {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 90 * dt;
      d.life -= dt;
    }
    this.dust = this.dust.filter((d) => d.life > 0);
  }
  dustBurst(x, y, count = 6) {
    for (let k = 0; k < count; k++)
      this.dust.push({
        x: x + (k - count / 2) * 3,
        y: y - 3,
        vx: (k - (count - 1) / 2) * 16,
        vy: -12 - (k % 3) * 9,
        life: 0.24 + (k % 2) * 0.08,
      });
  }
  drawHero(p, x, y, size = 0.85, face = 1, invincible = false) {
    p.person(
      x - (this.actor.state === "wall" ? this.player.wall * 15 : 0),
      y,
      size,
      this.actor.time,
      this.actor.state === "wall"
        ? this.player.wall
        : ["up", "down"].includes(this.direction)
          ? 1
          : face,
      invincible,
      p.hero,
      this.renderState(),
    );
  }
  renderState() {
    return directionalState(this.actor.state, this.direction);
  }
  celebrateStep(dt) {
    this.presentationTime += dt;
    this.actor.update(dt, { celebrate: true });
    if (this.buddy) this.buddy.actor.update(dt, { celebrate: true });
    this.stepEffects(dt);
    if (this.bean) {
      this.bean.actor.update(dt, { state: "celebrate" });
    }
  }
  cue(name, frequency = 440, duration = 0.08) {
    if (this.sound.effect) this.sound.effect(name);
    else this.sound.play(frequency, duration);
  }
  announce(text) {
    this.notice = text;
    this.noticeTime = 2.5;
  }
  burst(x, y, c = "#fff0a3", cue = "pickup") {
    for (let i = 0; i < 14; i++)
      this.particles.push({
        x,
        y,
        vx: Math.cos(i * 2.4) * 80,
        vy: Math.sin(i * 2.4) * 80,
        life: 0.7,
        c,
      });
    if (cue) this.cue(cue, 660 + this.score * 35);
  }
  effects(p, camera = 0) {
    for (const d of this.dust)
      p.rect(
        d.x - camera,
        d.y,
        3,
        3,
        this.precision ? "#b9e8e4" : "#e3c9a1",
        0,
        d.life > 0.08 ? 1 : 0.5,
      );
    for (const q of this.particles) p.star(q.x - camera, q.y, 4 * q.life, q.c);
  }
  win() {
    if (this.done) return;
    this.done = true;
    if (this.sound.effect) this.sound.effect("victory");
    else this.sound.play(1046, 0.4);
  }
  sky(p, c = "#d7e5d7", camera = 0) {
    p.begin(c);
    p.circle(774 - camera * 0.08, 96, 43, "#f7efc8");
    for (let i = 0; i < 5; i++)
      p.cloud(
        ((((i * 237 - camera * 0.15) % 1200) + 1200) % 1200) - 80,
        110 + (i % 3) * 50,
        0.6 + (i % 2) * 0.3,
      );
  }
}
