// Eight-way thumb input with a neutral center and cancellation outside the pad.
export function thumbDirections(x, y) {
  if (Math.abs(x) > 1.5 || Math.abs(y) > 1.5) return [];
  const ax = Math.abs(x),
    ay = Math.abs(y),
    keys = [];
  if (ax > 0.24 && ax >= ay * 0.45) keys.push(x < 0 ? "left" : "right");
  if (ay > 0.24 && ay >= ax * 0.45) keys.push(y < 0 ? "up" : "down");
  return keys;
}
