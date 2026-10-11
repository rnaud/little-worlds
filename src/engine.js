import * as THREE from "three";
import { sprite, tile } from "./pixels.js";
import { characterVariant, kartVariant } from "./characters.js";
import { creatureVariant } from "./creatures.js";
import { objectVariant, objectFrame } from "./objects.js";
import { thumbDirections } from "./input-math.js";
import { THEMES, themeStep } from "./music.js";
import {
  background,
  prop,
  worldTile,
  WORLDS,
  parallaxLayers,
} from "./world-art.js";
const palette = {
  "#d6dfec": "#7794d8",
  "#dce8c9": "#7aafd7",
  "#b0bdd0": "#605d95",
  "#aec697": "#428d68",
  "#f4f0e8": "#dcd9f1",
  "#bfd5a4": "#73b77b",
  "#a8c8ac": "#24684b",
  "#c8d5ab": "#4a934a",
  "#dfd5ae": "#c19859",
  "#747a9c": "#292345",
  "#596a89": "#202442",
  "#9293a5": "#252540",
  "#dedec0": "#3b7c52",
  "#aec99f": "#34864b",
  "#e1bcb0": "#e9c27d",
  "#f0e0b9": "#615570",
  "#b5a4b1": "#40344f",
  "#c2adb7": "#665271",
  "#a5b68d": "#387e4d",
};
function retroColor(c) {
  return palette[c] || c;
}
export const W = 960,
  H = 540;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const overlap = (a, b) =>
  a.x - a.w / 2 < b.x + b.w / 2 &&
  a.x + a.w / 2 > b.x - b.w / 2 &&
  a.y - a.h / 2 < b.y + b.h / 2 &&
  a.y + a.h / 2 > b.y - b.h / 2;
export const near = (a, b, r) => Math.hypot(a.x - b.x, a.y - b.y) < r;
// Pooled planar meshes: all worlds render through one orthographic Three.js scene.
export class Painter {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
    });
    this.renderer.setPixelRatio(1);
    this.textures = new Map();
    this.hero = "gaia";
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, W, 0, H, 0.1, 100);
    this.camera.position.z = 50;
    this.pool = [];
    this.cursor = 0;
    this.geometries = {
      rect: new THREE.PlaneGeometry(1, 1),
      circle: new THREE.CircleGeometry(0.5, 24),
      triangle: new THREE.CircleGeometry(0.5, 3, -Math.PI / 2),
      diamond: new THREE.CircleGeometry(0.5, 4),
    };
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.canvas = canvas;
    this.resize();
  }
  resize() {
    const parent = this.canvas.parentElement,
      r = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.max(
      1,
      Math.floor(
        Math.min(
          (parent.clientWidth * dpr) / 320,
          (parent.clientHeight * dpr) / 180,
        ),
      ),
    );
    const width = (320 * scale) / dpr,
      height = (180 * scale) / dpr;
    this.renderer.setSize(320, 180, false);
    Object.assign(this.canvas.style, {
      width: `${width}px`,
      height: `${height}px`,
      left: `${Math.round((r.left + parent.clientLeft + (parent.clientWidth - width) / 2) * dpr) / dpr - r.left - parent.clientLeft}px`,
      top: `${Math.round((r.top + parent.clientTop + (parent.clientHeight - height) / 2) * dpr) / dpr - r.top - parent.clientTop}px`,
    });
    this.camera.left = 0;
    this.camera.right = W;
    this.camera.top = 0;
    this.camera.bottom = H;
    this.camera.updateProjectionMatrix();
  }
  backdrop(id, camera = 0) {
    this.begin(WORLDS[id].base);
    const canvas = background(id);
    const layers = parallaxLayers(id);
    if (layers.length === 3) {
      if (canvas) this.texture("world:" + id, canvas);
      for (const layer of layers) {
        const offset = Math.round((camera * layer.speed) / 3) * 3,
          start = Math.floor(offset / 960);
        for (let tile = start; tile <= start + 1; tile++)
          this.shape(
            "rect",
            tile * 960 - offset + 480,
            270,
            tile % 2 ? -960 : 960,
            540,
            "#ffffff",
            0,
            1,
            this.texture(`parallax:${id}:${layer.name}`, layer.canvas),
          );
      }
      return;
    }

    if (canvas)
      this.shape(
        "rect",
        480,
        270,
        960,
        540,
        "#ffffff",
        0,
        1,
        this.texture("world:" + id, canvas),
      );
  }
  prop(id, x, y) {
    const canvas = objectFrame("flora-" + id) || prop(id);
    return this.shape(
      "rect",
      x,
      y - 60,
      96,
      120,
      "#ffffff",
      0,
      1,
      this.texture("prop:" + id, canvas),
    );
  }
  begin(color) {
    this.cursor = 0;
    this.scene.background = new THREE.Color(retroColor(color));
  }
  shape(type, x, y, w, h, color, rotation = 0, alpha = 1, texture = null) {
    let m = this.pool[this.cursor];
    if (!m) {
      m = new THREE.Mesh(
        this.geometries[type],
        new THREE.MeshBasicMaterial({
          transparent: true,
          depthTest: false,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      m.material.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <alphatest_fragment>",
          `
          float pattern = mod(floor(gl_FragCoord.x), 2.0) + 2.0 * mod(floor(gl_FragCoord.y), 2.0);
          if (diffuseColor.a <= (pattern + 0.5) / 4.0) discard;
          diffuseColor.a = 1.0;
        `,
        );
      };
      this.pool.push(m);
      this.scene.add(m);
    }
    // Rasterize curves into binary pixel masks before Three.js draws them.
    const pw = Math.max(1, Math.round(Math.abs(w) / 3));
    const ph = Math.max(1, Math.round(Math.abs(h) / 3));
    if (!texture && type !== "rect") {
      const key = `mask:${type}:${pw}:${ph}`;
      if (!this.textures.has(key)) {
        const c = document.createElement("canvas");
        c.width = pw;
        c.height = ph;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "white";
        for (let py = 0; py < ph; py++)
          for (let px = 0; px < pw; px++) {
            const nx = ((px + 0.5) / pw) * 2 - 1,
              ny = ((py + 0.5) / ph) * 2 - 1;
            if (
              type === "circle"
                ? nx * nx + ny * ny <= 1
                : type === "diamond"
                  ? Math.abs(nx) + Math.abs(ny) <= 1
                  : Math.abs(nx) <= (ny + 1) / 2
            )
              ctx.fillRect(px, py, 1, 1);
          }
        this.texture(key, c);
      }
      texture = this.textures.get(key);
    }
    m.geometry = this.geometries.rect;
    m.visible = true;
    // Snap edges, not centers: odd-sized sprites need half-pixel centers.
    m.position.set(
      (Math.round(x / 3 - pw / 2) + pw / 2) * 3,
      (Math.round(y / 3 - ph / 2) + ph / 2) * 3,
      0,
    );
    m.scale.set(pw * 3 * Math.sign(w || 1), ph * 3, 1);
    m.rotation.z = 0;
    m.material.color.set(retroColor(color));
    if (m.material.map !== texture) {
      m.material.map = texture;
      m.material.needsUpdate = true;
    }
    m.material.opacity = alpha;
    m.renderOrder = this.cursor++;
    return m;
  }
  rect(x, y, w, h, c, angle = 0, a = 1) {
    return this.shape("rect", x, y, w, h, c, angle, a);
  }
  circle(x, y, r, c, a = 1) {
    return this.shape("circle", x, y, r * 2, r * 2, c, 0, a);
  }
  star(x, y, r, c = "#fff1b8") {
    this.sprite("star", x, y, Math.max(0.25, r / 6), 0, false, 1, c);
  }
  marker(x, y, color = "#ffe4a4") {
    this.rect(x, y - 5, 4, 12, color);
    this.line(x - 8, y, x, y + 8, 4, color);
    this.line(x, y + 8, x + 8, y, 4, color);
  }
  line(x1, y1, x2, y2, width, c) {
    let x = Math.round(x1 / 3),
      y = Math.round(y1 / 3);
    const tx = Math.round(x2 / 3),
      ty = Math.round(y2 / 3),
      dx = Math.abs(tx - x),
      dy = -Math.abs(ty - y);
    const sx = x < tx ? 1 : -1,
      sy = y < ty ? 1 : -1;
    let err = dx + dy;
    const thickness = Math.max(1, Math.round(width / 3)) * 3;
    while (true) {
      this.rect(x * 3 + 1.5, y * 3 + 1.5, thickness, thickness, c);
      if (x === tx && y === ty) break;
      const e = 2 * err;
      if (e >= dy) {
        err += dy;
        x += sx;
      }
      if (e <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  texture(key, canvas) {
    if (!this.textures.has(key)) {
      const t = new THREE.CanvasTexture(canvas);
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestFilter;
      t.generateMipmaps = false;
      t.flipY = false;
      t.colorSpace = THREE.SRGBColorSpace;
      this.textures.set(key, t);
    }
    return this.textures.get(key);
  }
  sprite(
    id,
    x,
    y,
    scale = 2,
    frame = 0,
    flip = false,
    alpha = 1,
    tint = "#ffffff",
  ) {
    const source = sprite(id, frame);
    const width = Math.max(1, Math.round((source.width * scale) / 3));
    const height = Math.max(1, Math.round((source.height * scale) / 3));
    const key = `native:${id}:${frame}:${width}:${height}`;
    if (!this.textures.has(key)) {
      // Build a native-resolution variant once. Runtime texels are always 1:1.
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      const ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(source, 0, 0, width, height);
      this.texture(key, c);
    }
    return this.shape(
      "rect",
      x,
      y,
      width * 3 * (flip ? -1 : 1),
      height * 3,
      tint,
      0,
      alpha,
      this.textures.get(key),
    );
  }

  cloud(x, y, s = 1) {
    this.sprite("cloud", x, y - 12 * s, 2 * s);
  }
  object(id, x, y, size = 1, alpha = 1) {
    const canvas = objectVariant(id, size);
    if (!canvas) return this.shape("diamond", x, y, 30, 36, "#ffdc83");
    return this.shape(
      "rect",
      x,
      y,
      canvas.width * 3,
      canvas.height * 3,
      "#ffffff",
      0,
      alpha,
      this.texture(`object:${id}:${canvas.width}:${canvas.height}`, canvas),
    );
  }
  creature(id, x, y, time = 0, size = 1, flip = false, alpha = 1) {
    const base = id === "winged-unicorn" ? [40, 28] : [24, 24];
    const width = Math.round(base[0] * size),
      height = Math.round(base[1] * size);
    const result = creatureVariant(id, time, width, height);
    if (!result)
      return this.sprite(
        id === "winged-unicorn"
          ? "unicorn"
          : id === "crystal-rock"
            ? "rock"
            : "slime",
        x,
        y,
        2 * size,
      );
    return this.shape(
      "rect",
      x,
      y,
      width * 3 * (flip ? -1 : 1),
      height * 3,
      "#ffffff",
      0,
      alpha,
      this.texture(
        `creature:${id}:${result.frame}:${width}:${height}`,
        result.canvas,
      ),
    );
  }
  kart(
    id,
    x,
    y,
    steer = 0,
    boost = false,
    small = false,
    alpha = 1,
    scale = 1,
  ) {
    const frame = boost ? 3 : steer < -0.15 ? 1 : steer > 0.15 ? 2 : 0;
    const width = Math.max(4, Math.round((small ? 18 : 24) * scale)),
      height = Math.max(6, Math.round((small ? 24 : 32) * scale));
    const source = kartVariant(id, frame, width, height);
    if (!source)
      return this.sprite("kart", x, y, small ? 1.6 : 2.5, 0, false, alpha);
    return this.shape(
      "rect",
      x,
      y - 12,
      width * 3,
      height * 3,
      "#ffffff",
      0,
      alpha,
      this.texture(`kart:${id}:${frame}:${width}:${height}`, source),
    );
  }
  rider(id, x, seatY, time, state = "ride", small = false, alpha = 1) {
    const width = id === "bean" ? (small ? 24 : 30) : small ? 18 : 22,
      height = small ? 22 : 28;
    const result = characterVariant(id, state, time, width, height);
    if (!result)
      return this.person(x, seatY - 10, 0.65, time, 1, false, id, state);
    const anchorX = id === "bean" ? 18 / 40 : 14 / 32,
      anchorY = id === "bean" ? 35 / 40 : 30 / 40;
    return this.shape(
      "rect",
      x - (anchorX - 0.5) * width * 3,
      seatY - (anchorY - 0.5) * height * 3,
      width * 3,
      height * 3,
      "#ffffff",
      0,
      alpha,
      this.texture(
        `rider:${id}:${result.frame}:${width}:${height}`,
        result.canvas,
      ),
    );
  }
  tree(x, y, s = 1) {
    this.sprite("tree", x, y - 61 * s, 2.2 * s);
  }
  person(
    x,
    y,
    s = 1,
    t = 0,
    face = 1,
    invincible = false,
    id = this.hero,
    state = "idle",
  ) {
    const base =
      id === "bean"
        ? [36, 30]
        : state.startsWith("carry")
          ? [24, 26]
          : id === "gaia"
            ? [24, 30]
            : [24, 32];
    const size = s >= 1.4 ? 1.35 : s < 0.72 ? 0.7 : s > 1.1 ? 1.15 : 1;
    const width = Math.round(base[0] * size),
      height = Math.round(base[1] * size);
    const result = characterVariant(id, state, t, width, height);
    if (result) {
      const foot = y + 18 * s;
      // The source baseline is y=38/40. Keep feet fixed across frames and flips.
      const center = foot - (38 / 40 - 0.5) * height * 3;
      return this.shape(
        "rect",
        x,
        center,
        width * 3 * (face < 0 ? -1 : 1),
        height * 3,
        "#ffffff",
        0,
        invincible && Math.floor(t * 16) % 2 ? 0.4 : 1,
        this.texture(
          `actor:${id}:${result.frame}:${width}:${height}`,
          result.canvas,
        ),
      );
    }
    return this.sprite(
      id,
      x,
      y - 14 * s,
      1.65 * s,
      Math.floor(t * 6) % 2,
      face < 0,
      invincible && Math.floor(t * 16) % 2 ? 0.4 : 1,
    );
  }
  banana(x, y, s = 1) {
    this.sprite("banana", x, y, 2 * s);
  }
  platform(x, y, w, h, kind = "meadow") {
    const width = Math.max(1, Math.round(w / 3)),
      height = Math.max(1, Math.round(h / 3)),
      key = `platform:${kind}:${width}:${height}`;
    if (!this.textures.has(key)) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      const colors =
        kind === "summit"
          ? ["#2b3a55", "#49627b", "#90bebf", "#edf7eb"]
          : ["#49394b", "#805344", "#75aa73", "#ffe7a3"];
      const rect = (x, y, w, h, c) => {
        ctx.fillStyle = colors[c];
        ctx.fillRect(x, y, w, h);
      };
      rect(0, 0, width, height, 0);
      rect(1, 2, width - 2, height - 3, 1);
      rect(1, 1, width - 2, 2, 3);
      rect(1, 3, width - 2, 2, 2);
      for (let px = 9; px < width - 6; px += 26) {
        rect(px, Math.min(height - 2, 8 + (px % 3)), 6, 1, 0);
        if (height > 18) rect(px + 8, 20, 5, 1, 0);
      }
      this.texture(key, canvas);
    }
    return this.shape(
      "rect",
      x,
      y,
      width * 3,
      height * 3,
      "#ffffff",
      0,
      1,
      this.textures.get(key),
    );
  }
  terrain(x, y, w, h, kind = "grass") {
    const width = Math.max(1, Math.round(w / 3)),
      height = Math.max(1, Math.round(h / 3)),
      key = "terrain:" + kind + ":" + width + ":" + height;
    if (!this.textures.has(key)) {
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      const ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      for (let yy = 0; yy < height; yy += 16)
        for (let xx = 0; xx < width; xx += 16)
          ctx.drawImage(
            worldTile(
              yy > 0 && ["frost", "coral"].includes(kind)
                ? kind + "-body"
                : kind,
            ) || tile(kind),
            xx,
            yy,
          );
      this.texture(key, c);
    }
    return this.shape(
      "rect",
      x,
      y,
      w,
      h,
      "#ffffff",
      0,
      1,
      this.textures.get(key),
    );
  }
  finish() {
    for (let i = this.cursor; i < this.pool.length; i++)
      this.pool[i].visible = false;
    this.renderer.render(this.scene, this.camera);
  }
  dispose() {
    this.resizeObserver.disconnect();
    for (const m of this.pool) m.material.dispose();
    Object.values(this.geometries).forEach((g) => g.dispose());
    for (const t of this.textures.values()) t.dispose();
    this.renderer.dispose();
  }
}
export class Input {
  constructor() {
    this.pending = new Set();
    this.keys = new Set();
    this.secondKeys = new Set();
    this.secondPending = new Set();
    this.secondPrevious = {};
    this.second = { x: 0, y: 0, current: {}, pressed: {}, released: {} };
    this.multiplayer = false;
    this.coopTouch = false;
    this.secondMapping = {
      KeyA: "left",
      KeyD: "right",
      KeyW: "up",
      KeyS: "down",
      KeyF: "a",
      KeyG: "b",
      KeyQ: "recall",
    };
    this.touches = new Map();
    this.current = {};
    this.previous = {};
    this.pressed = {};
    this.padName = "";
    this.padHistory = new Map();
    this.activePadIndex = 0;
    this.onPause = () => {};
    this.onRestart = () => {};
    this.enabled = true;
    this.mapping = {
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
      ArrowUp: "up",
      KeyW: "up",
      ArrowDown: "down",
      KeyS: "down",
      Space: "a",
      KeyZ: "a",
      KeyX: "b",
      ShiftLeft: "b",
      ShiftRight: "b",
      Enter: "a",
      Escape: "pause",
      KeyP: "pause",
      KeyR: "restart",
    };
    window.addEventListener("keydown", (e) => {
      if (
        /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) ||
        e.target.closest("dialog[open]")
      )
        return;
      const secondary = this.multiplayer && this.secondMapping[e.code];
      const k = secondary || this.mapping[e.code];
      if (k) {
        if (
          e.target.tagName === "BUTTON" &&
          !e.target.dataset.key &&
          (e.code === "Enter" || e.code === "Space")
        )
          return;
        e.preventDefault();
        const keys = secondary ? this.secondKeys : this.keys,
          pending = secondary ? this.secondPending : this.pending;
        if (!keys.has(k)) pending.add(k);
        keys.add(k);
      }
    });
    window.addEventListener("keyup", (e) => {
      this.keys.delete(this.mapping[e.code]);
      this.secondKeys.delete(this.secondMapping[e.code]);
    });
    window.addEventListener("blur", () => this.clear());
    const dpad = document.querySelector(".dpad");
    const moveThumb = (e) => {
      if (e.type !== "pointerdown" && !this.touches.has(e.pointerId)) return;
      e.preventDefault();
      const r = dpad.getBoundingClientRect(),
        next = thumbDirections(
          (e.clientX - r.x - r.width / 2) / (r.width / 2),
          (e.clientY - r.y - r.height / 2) / (r.height / 2),
        );
      const before = this.touches.get(e.pointerId) || [];
      for (const key of next) if (!before.includes(key)) this.pending.add(key);
      this.touches.set(e.pointerId, next);
      this.refreshTouchButtons();
    };
    dpad.addEventListener("pointerdown", (e) => {
      dpad.setPointerCapture(e.pointerId);
      moveThumb(e);
    });
    dpad.addEventListener("pointermove", moveThumb);
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
      dpad.addEventListener(event, (e) => {
        this.touches.delete(e.pointerId);
        this.refreshTouchButtons();
      });
    for (const button of document.querySelectorAll("[data-key]")) {
      if (button.closest(".dpad")) continue;
      button.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        button.setPointerCapture(e.pointerId);
        this.touches.set(e.pointerId, [button.dataset.key]);
        this.pending.add(button.dataset.key);
        this.refreshTouchButtons();
      });
      const end = (e) => {
        this.touches.delete(e.pointerId);
        this.refreshTouchButtons();
      };
      button.addEventListener("pointerup", end);
      button.addEventListener("pointercancel", end);
      button.addEventListener("lostpointercapture", end);
    }
  }
  refreshTouchButtons() {
    const keys = new Set([...this.touches.values()].flat());
    for (const button of document.querySelectorAll("[data-key]"))
      button.classList.toggle("held", keys.has(button.dataset.key));
  }
  poll() {
    const c = {};
    const secondary = {};
    if (this.multiplayer) {
      for (const k of this.secondPending) secondary[k] = true;
      for (const k of this.secondKeys) secondary[k] = true;
    }
    for (const k of this.pending) c[k] = true;
    for (const k of this.keys) c[k] = true;
    for (const keys of this.touches.values()) for (const k of keys) c[k] = true;
    let pad, secondPad;
    try {
      const pads = Array.from(navigator.getGamepads?.() || [])
        .map((p, index) => ({ p, index }))
        .filter(({ p }) => p?.connected);
      const activity = pads.map(({ p, index }) => {
        const buttons = p.buttons.map((b) => !!b.pressed),
          axes = p.axes.some((a) => Math.abs(a) > 0.28),
          before = this.padHistory.get(index);
        const buttonEdge = buttons.some(
            (pressed, n) => pressed && !before?.buttons[n],
          ),
          axisEdge = axes && !before?.axes;
        this.padHistory.set(index, { buttons, axes });
        return { p, index, buttonEdge, axisEdge };
      });
      const changed =
        activity.find((a) => a.buttonEdge) || activity.find((a) => a.axisEdge);
      if (changed && !this.multiplayer) this.activePadIndex = changed.index;
      if (this.multiplayer) {
        pad = this.coopTouch ? null : pads[0]?.p;
        secondPad = pads[this.coopTouch ? 0 : 1]?.p;
      } else
        pad = (pads.find((a) => a.index === this.activePadIndex) || pads[0])?.p;
      for (const index of this.padHistory.keys())
        if (!pads.some((a) => a.index === index)) this.padHistory.delete(index);
    } catch {}
    this.padName = pad?.id || secondPad?.id || "";
    this.secondPadName = secondPad?.id || "";
    if (secondPad) {
      const b = (n) => !!secondPad.buttons[n]?.pressed;
      secondary.left ||= b(14) || secondPad.axes[0] < -0.28;
      secondary.right ||= b(15) || secondPad.axes[0] > 0.28;
      secondary.up ||= b(12) || secondPad.axes[1] < -0.28;
      secondary.down ||= b(13) || secondPad.axes[1] > 0.28;
      secondary.a ||= b(0);
      secondary.b ||= b(1) || b(2);
      secondary.recall ||= b(3) || b(8);
      c.pause ||= b(9);
    }
    if (pad) {
      const b = (i) => !!pad.buttons[i]?.pressed;
      c.left ||= b(14) || pad.axes[0] < -0.28;
      c.right ||= b(15) || pad.axes[0] > 0.28;
      c.up ||= b(12) || pad.axes[1] < -0.28;
      c.down ||= b(13) || pad.axes[1] > 0.28;
      c.a ||= b(0);
      c.b ||= b(1) || b(2);
      c.pause ||= b(9);
      c.restart ||= b(8);
    }
    this.released = {};
    for (const k in this.previous) this.released[k] = this.previous[k] && !c[k];
    this.pressed = {};
    for (const k in c)
      this.pressed[k] = this.pending.has(k) || (c[k] && !this.previous[k]);
    this.pending.clear();
    this.current = c;
    this.previous = { ...c };
    this.x = (c.right ? 1 : 0) - (c.left ? 1 : 0);
    this.y = (c.down ? 1 : 0) - (c.up ? 1 : 0);
    const secondPressed = {},
      secondReleased = {};
    for (const k in secondary)
      secondPressed[k] =
        this.secondPending.has(k) || (secondary[k] && !this.secondPrevious[k]);
    for (const k in this.secondPrevious)
      secondReleased[k] = this.secondPrevious[k] && !secondary[k];
    this.second = {
      x: (secondary.right ? 1 : 0) - (secondary.left ? 1 : 0),
      y: (secondary.down ? 1 : 0) - (secondary.up ? 1 : 0),
      current: secondary,
      pressed: secondPressed,
      released: secondReleased,
    };
    this.secondPrevious = { ...secondary };
    this.secondPending.clear();
    return this;
  }
  clear() {
    this.pending.clear();
    this.keys.clear();
    this.secondKeys.clear();
    this.secondPending.clear();
    this.second = { x: 0, y: 0, current: {}, pressed: {}, released: {} };
    this.released = {};
    this.touches.clear();
    this.current = {};
    this.pressed = {};
    document
      .querySelectorAll(".held")
      .forEach((b) => b.classList.remove("held"));
  }
}
export class Sound {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.voices = new Set();
  }
  unlock() {
    if (!this.enabled) return;
    try {
      this.ctx ??= new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    } catch {}
  }
  stop() {
    this.stopMotor();
    for (const o of this.voices) {
      try {
        o.stop();
      } catch {}
    }
    this.voices.clear();
    this.musicCursor = null;
    this.musicWorld = null;
  }
  effect(name) {
    const motifs = {
      pickup: [
        [784, 0.07, 0],
        [1047, 0.13, 0.055],
      ],
      victory: [
        [523, 0.16, 0],
        [659, 0.16, 0.12],
        [784, 0.16, 0.24],
        [1047, 0.45, 0.4],
      ],
      jump: [
        [240, 0.05, 0],
        [420, 0.08, 0.035],
      ],
      dash: [
        [880, 0.045, 0],
        [660, 0.065, 0.035],
        [440, 0.08, 0.07],
      ],
      select: [
        [523, 0.045, 0],
        [784, 0.065, 0.04],
      ],
    };
    for (const [frequency, duration, delay] of motifs[name] || [])
      this.play(
        frequency,
        duration,
        "triangle",
        delay,
        name === "victory" ? 0.055 : 0.04,
      );
  }
  motor(speed, boost = false) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== "running") return;
    if (!this.engineVoice) {
      const oscillator = this.ctx.createOscillator(),
        gain = this.ctx.createGain();
      oscillator.type = "triangle";
      gain.gain.value = 0.0001;
      oscillator.connect(gain);
      gain.connect(this.ctx.destination);
      oscillator.start();
      this.engineVoice = { oscillator, gain };
    }
    this.engineVoice.oscillator.frequency.setTargetAtTime(
      48 + speed * 0.19 + (boost ? 14 : 0),
      this.ctx.currentTime,
      0.06,
    );
    this.engineVoice.gain.gain.setTargetAtTime(
      speed > 20 ? 0.012 : 0.004,
      this.ctx.currentTime,
      0.08,
    );
  }
  stopMotor() {
    if (!this.engineVoice) return;
    const { oscillator, gain } = this.engineVoice;
    oscillator.stop();
    oscillator.disconnect();
    gain.disconnect();
    this.engineVoice = null;
  }
  music(id, time) {
    const theme = THEMES[id];
    if (!this.enabled || !theme) return;
    const step = 60 / theme.bpm / 2;
    if (
      this.musicWorld !== id ||
      this.musicCursor == null ||
      time < (this.musicTime || 0)
    ) {
      this.musicWorld = id;
      this.musicCursor = Math.floor(time / step);
    }
    this.musicTime = time;
    while (this.musicCursor * step <= time + 0.1) {
      const delay = this.musicCursor * step - time;
      if (delay >= -0.03)
        for (const note of themeStep(id, this.musicCursor))
          this.play(
            note.frequency,
            note.duration,
            note.type,
            Math.max(0, delay),
            note.level,
          );
      this.musicCursor++;
    }
  }
  play(f = 660, d = 0.13, type = "sine", delay = 0, level = 0.07) {
    if (!this.enabled) return;
    this.unlock();
    if (
      !this.ctx ||
      (this.ctx.state === "suspended" && !this.ctx.startRendering)
    )
      return;
    const o = this.ctx.createOscillator(),
      g = this.ctx.createGain(),
      t = this.ctx.currentTime + delay;
    this.voices.add(o);
    o.onended = () => {
      this.voices.delete(o);
      o.disconnect();
      g.disconnect();
    };
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + d + 0.02);
  }
}
