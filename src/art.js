import { paintRallyRoad } from "./rally-art.js";
import { cover, sprite } from "./pixels.js";
import { worldCover } from "./world-art.js";
import {
  characterFrame,
  characterVariant,
  kartDebugFrames,
} from "./characters.js";
import { creatureFrame, creatureVariant } from "./creatures.js";
import { objectFrame } from "./objects.js";
const covers = new Map();
export function art(kind, large = false) {
  const key = `${kind}:${large}`;
  if (covers.has(key)) return covers.get(key);
  const c = worldCover(kind);
  if (!c) return cover(kind, large);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const draw = (source, x, y) => {
    if (source) ctx.drawImage(source, x, y);
  };
  const actor = (id, state, x, y, time = 0) =>
    draw(characterFrame(id, state, time) || sprite(id), x, y);
  // Each cartridge shows its actual role-specific poses, on the same native grid.
  if (large) {
    for (const [id, x] of [
      ["gaia", 65],
      ["bean", 99],
      ["nur", 139],
      ["arnaud", 175],
    ])
      actor(id, "celebrate", x, 109);
  } else if (kind === "rally") {
    const road = document.createElement("canvas");
    road.width = 320;
    road.height = 180;
    paintRallyRoad(road.getContext("2d"), 350);
    ctx.drawImage(road, 32, 10, 256, 160, 0, 0, 256, 160);
    draw(kartDebugFrames("gaia")[1], 89, 110);
    draw(kartDebugFrames("bean")[2], 147, 117);
  } else if (kind === "space") {
    draw(creatureFrame("winged-unicorn", 0.25), 96, 119);
    actor("gaia", "rideAction", 102, 102);
    draw(creatureVariant("winged-unicorn", 0.4, 28, 20)?.canvas, 163, 132);
    draw(characterVariant("bean", "ride", 0.1, 24, 24)?.canvas, 165, 119);
  } else if (kind === "bricks") {
    actor("gaia", "carry", 103, 112);
    actor("bean", "play", 149, 112);
    draw(objectFrame("brass-paddle"), 95, 109);
    draw(objectFrame("clockwork-gem"), 119, 81);
  } else if (kind === "garden") {
    actor("gaia", "push", 88, 109);
    draw(objectFrame("pink-pot"), 123, 126);
    actor("bean", "sniff", 151, 110);
  } else if (kind === "bubbles") {
    ctx.fillStyle = "#a8ded9";
    ctx.fillRect(31, 128, 77, 4);
    ctx.fillRect(137, 96, 85, 4);
    actor("gaia", "action", 79, 91, 0.12);
    actor("bean", "jump", 139, 111);
    draw(creatureFrame("leaf-slime", 0.1), 173, 71);
    ctx.strokeStyle = "#9de0e2";
    ctx.lineWidth = 1;
    ctx.strokeRect(169.5, 66.5, 28, 29);
  } else if (kind === "splash") {
    for (let y = 93; y < 145; y += 18)
      for (let x = 52; x < 206; x += 18) {
        ctx.fillStyle = (x + y) % 36 === 1 ? "#dfc995" : "#e8d5a5";
        ctx.fillRect(x, y, 17, 17);
      }
    actor("gaia", "actionDown", 85, 102, 0.1);
    actor("bean", "curious", 145, 112);
    draw(objectFrame("pink-pot"), 120, 100);
  } else if (kind === "forest") {
    actor("gaia", "actionUp", 101, 107, 0.1);
    actor("bean", "curious", 143, 110);
    draw(objectFrame("amber-lantern"), 85, 111);
  } else if (kind === "meadow") {
    actor("gaia", "run", 92, 110, 0.12);
    actor("bean", "run", 140, 110, 0.17);
    draw(objectFrame("bananas"), 130, 92);
  } else {
    actor("gaia", "jump", 97, 94);
    actor("bean", "jump", 140, 113, 0.15);
    draw(objectFrame("flora-crystal"), 58, 113);
  }
  const html = `<img class="pixel-cover" src="${c.toDataURL()}" alt="${kind} scene with Gaia and Bean in their game poses"/>`;
  covers.set(key, html);
  return html;
}
