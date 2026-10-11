const vm = require("node:vm"),
  fs = require("node:fs"),
  assert = require("node:assert/strict");
const nodes = new Map(),
  events = {};
const ctx = new Proxy(
  { createLinearGradient: () => ({ addColorStop() {} }) },
  { get: (o, k) => o[k] || (() => {}) },
);
function node(id) {
  if (!nodes.has(id))
    nodes.set(id, {
      hidden: false,
      textContent: "",
      addEventListener: (k, f) => (events[id + k] = f),
      setAttribute() {},
      getContext: () => ctx,
      getBoundingClientRect: () => ({
        width: 1100,
        height: 536,
        left: 0,
        top: 0,
      }),
    });
  return nodes.get(id);
}
const env = {
  document: { querySelector: node },
  window: { addEventListener: (k, f) => (events[k] = f) },
  ResizeObserver: class {
    observe() {}
  },
  devicePixelRatio: 1,
  requestAnimationFrame() {},
  Math,
  console,
};
vm.createContext(env);
vm.runInContext(fs.readFileSync("public/rainbow-flight/game.js", "utf8"), env);
const run = (s) => vm.runInContext(s, env);
run("resize();begin()");
assert.equal(run("mode"), "playing");
run("keys.add('ArrowUp');frame(40)");
assert.ok(run("player.y") < 536 * 0.48);
run("keys.clear();pause()");
const y = run("player.y");
run("frame(80)");
assert.equal(run("player.y"), y);
assert.equal(run("mode"), "paused");
run("pause()");
for (let i = 0; i < 20; i++)
  run(`bananas=[{x:player.x,y:player.y,phase:0}];frame(${120 + i * 40})`);
assert.equal(run("score"), 20);
assert.equal(run("mode"), "won");
assert.equal(node("#finish").hidden, false);
run("begin()");
assert.equal(run("score"), 0);
assert.equal(run("bananas.length"), 0);
assert.equal(node("#finish").hidden, true);
run("bananas=[{x:-100,y:150,phase:0}];frame(1000)");
assert.equal(run("mode"), "playing");
assert.equal(run("score"), 0);
run("pointer.active=true;pointer.x=-1000;pointer.y=9999;frame(1040)");
assert.ok(run("player.x>=55 && player.y<=h-65"));
console.log(
  "PASS: movement, pause, 20 pickups, victory, restart, missed bananas, touch bounds",
);
