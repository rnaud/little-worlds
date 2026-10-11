// Named animation clips with explicit timing. Independent of DOM/rendering and physics.
export const HUMAN_CLIPS = {
  idle: {
    frames: [0, 1, 0, 2, 0, 3],
    durations: [1.1, 0.35, 0.7, 0.12, 0.55, 0.4],
  },
  run: { frames: [4, 5, 6, 7], durations: [0.11, 0.085, 0.11, 0.085] },
  jump: { frames: [9], durations: [1] },
  fall: { frames: [10], durations: [1] },
  dash: { frames: [11], durations: [1] },
  land: { frames: [8, 0], durations: [0.085, 0.04], once: true },
  action: { frames: [12, 13, 12], durations: [0.075, 0.16, 0.09], once: true },
  actionDown: {
    frames: [31, 32, 31],
    durations: [0.075, 0.16, 0.09],
    once: true,
  },
  actionUp: {
    frames: [33, 34, 33],
    durations: [0.075, 0.16, 0.09],
    once: true,
  },
  wall: { frames: [35, 36], durations: [0.28, 0.2] },
  celebrate: { frames: [14, 15], durations: [0.32, 0.26] },
  hurt: { frames: [8, 10], durations: [0.13, 0.13] },
  ride: { frames: [22, 23, 22, 24], durations: [0.35, 0.25, 0.35, 0.25] },
  rideAction: { frames: [25, 23], durations: [0.16, 0.08] },
  rideHurt: { frames: [24], durations: [1] },
  push: { frames: [26], durations: [1] },
  pushDown: { frames: [27], durations: [1] },
  pushUp: { frames: [28], durations: [1] },
  carry: { frames: [29, 30], durations: [0.17, 0.17] },
  carryIdle: { frames: [29], durations: [1] },
  idleDown: { frames: [16], durations: [1] },
  walkDown: { frames: [17, 16, 18, 16], durations: [0.14, 0.07, 0.14, 0.07] },
  idleUp: { frames: [19], durations: [1] },
  walkUp: { frames: [20, 19, 21, 19], durations: [0.14, 0.07, 0.14, 0.07] },
};
export const BEAN_CLIPS = {
  idle: { frames: [0, 1, 2, 3], durations: [0.9, 0.6, 0.7, 0.25] },
  run: { frames: [4, 5, 6, 7], durations: [0.085, 0.065, 0.085, 0.065] },
  sniff: { frames: [8, 9, 8, 10], durations: [0.75, 0.4, 0.6, 0.45] },
  curious: { frames: [10, 2, 3], durations: [0.65, 0.35, 0.25] },
  play: { frames: [11, 0, 11], durations: [0.65, 0.35, 0.6] },
  sit: { frames: [15, 15, 2], durations: [1.2, 0.6, 0.2] },
  jump: { frames: [12, 13], durations: [0.09, 0.5], once: true },
  fall: { frames: [14], durations: [1] },
  dash: { frames: [13], durations: [1] },
  land: { frames: [14, 11, 0], durations: [0.06, 0.07, 0.04], once: true },
  action: { frames: [10, 11, 0], durations: [0.12, 0.2, 0.12], once: true },
  actionDown: HUMAN_CLIPS.actionDown,
  actionUp: HUMAN_CLIPS.actionUp,
  wall: HUMAN_CLIPS.wall,
  celebrate: { frames: [11, 2, 15, 3], durations: [0.3, 0.3, 0.4, 0.25] },
  hurt: { frames: [14, 10], durations: [0.15, 0.15] },
  ride: HUMAN_CLIPS.ride,
  rideAction: HUMAN_CLIPS.rideAction,
  rideHurt: HUMAN_CLIPS.rideHurt,
  push: HUMAN_CLIPS.push,
  pushDown: HUMAN_CLIPS.pushDown,
  pushUp: HUMAN_CLIPS.pushUp,
  carry: HUMAN_CLIPS.carry,
  carryIdle: HUMAN_CLIPS.carryIdle,
  idleDown: HUMAN_CLIPS.idleDown,
  walkDown: HUMAN_CLIPS.walkDown,
  idleUp: HUMAN_CLIPS.idleUp,
  walkUp: HUMAN_CLIPS.walkUp,
};
export function directionalState(state, direction) {
  if (
    !["idle", "run", "push", "action"].includes(state) ||
    !["up", "down"].includes(direction)
  )
    return state;
  return `${state === "run" ? "walk" : state}${direction === "up" ? "Up" : "Down"}`;
}
export function clipFrame(id, state, time = 0) {
  const clips = id === "bean" ? BEAN_CLIPS : HUMAN_CLIPS;
  const clip = clips[state] || clips.idle;
  const total = clip.durations.reduce((a, b) => a + b, 0);
  let t = Math.max(0, time);
  if (clip.once && t >= total) return clip.frames.at(-1);
  t %= total;
  for (let i = 0; i < clip.frames.length; i++) {
    if (t < clip.durations[i]) return clip.frames[i];
    t -= clip.durations[i];
  }
  return clip.frames.at(-1);
}
export function actorState({
  celebrate = false,
  hurt = false,
  dash = false,
  action = false,
  ground = true,
  vy = 0,
  land = false,
  moving = false,
  ride = false,
  wall = false,
} = {}) {
  if (celebrate) return "celebrate";
  if (hurt) return "hurt";
  if (dash) return "dash";
  if (action) return "action";
  if (!ground && wall && vy >= 0) return "wall";
  if (!ground) return vy < 0 ? "jump" : "fall";
  if (land) return "land";
  if (ride) return "ride";
  return moving ? "run" : "idle";
}
export class ActorAnimation {
  constructor() {
    this.state = "idle";
    this.time = 0;
    this.transitions = 0;
  }
  update(dt, context = {}) {
    const next = context.state || actorState(context);
    if (next !== this.state) {
      this.state = next;
      this.time = 0;
      this.transitions++;
    }
    const rate =
      next === "run"
        ? Math.max(0.65, Math.min(1.8, (context.speed || 190) / 190))
        : 1;
    this.time += dt * rate;
  }
  frame(id) {
    return clipFrame(id, this.state, this.time);
  }
}
