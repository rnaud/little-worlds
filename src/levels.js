// Authored bite-sized journeys. Geometry is independent of the artwork.
const ground = (x, w, top = 438) => [x, (top + 540) / 2, w, 540 - top];
const ledge = (x, top, w = 180) => [x, top + 12, w, 24];
export const SUMMIT_LEVELS = [
  {
    title: "First Ascent",
    need: 3,
    lesson:
      "Hold A to jump. Jump from the edge, then B to dash over the long gaps.",
    platforms: [
      ground(180, 360),
      ledge(390, 378, 156),
      ledge(570, 324, 204),
      ground(790, 260),
      ground(1290, 260),
      ledge(1420, 366, 156),
      ledge(1580, 300),
      ledge(1760, 234),
      [2180, 306, 264, 108],
      ground(1640, 440, 490),
    ],
    items: [
      [570, 285],
      [1760, 195],
      [2180, 213],
    ],
    checkpoints: [
      [790, 411],
      [1290, 411],
      [1760, 207],
    ],
    dashSigns: [
      [955, 385],
      [1910, 245],
    ],
    finish: [2260, 252],
  },
  {
    title: "Glacier Steps",
    need: 3,
    lesson:
      "Cracked ice shakes before it falls. Keep hopping; rest at the beacons.",
    platforms: [
      ground(150, 300),
      ledge(410, 372),
      ledge(625, 306),
      ledge(835, 240),
      ledge(1045, 306),
      ground(1280, 260),
      ground(1760, 280),
      ledge(1900, 366, 160),
      ledge(2100, 294, 240),
    ],
    items: [
      [625, 267],
      [1045, 267],
      [2100, 255],
    ],
    crumbling: [1, 2, 3],
    checkpoints: [
      [1045, 279],
      [1280, 411],
      [1760, 411],
    ],
    dashSigns: [[1480, 385]],
    finish: [2170, 294],
  },
  {
    title: "The Cloud Relay",
    need: 3,
    lesson:
      "Link your jumps and dashes. Every landing refills your dash; blue beacons save your progress.",
    platforms: [
      ground(170, 340),
      ledge(420, 378),
      ledge(620, 318, 200),
      ledge(860, 258, 240),
      ledge(1370, 258, 280),
      ledge(1540, 324),
      ground(1800, 260),
      ledge(1990, 366),
      ledge(2190, 300),
      ledge(2420, 234, 220),
      ledge(2900, 234, 260),
    ],
    items: [
      [620, 279],
      [2190, 261],
      [2900, 195],
    ],
    crumbling: [1, 2, 8],
    checkpoints: [
      [860, 231],
      [1370, 231],
      [1800, 411],
      [2420, 207],
    ],
    dashSigns: [
      [1020, 220],
      [2570, 200],
    ],
    finish: [2970, 234],
  },
];
export const MEADOW_LEVELS = [
  {
    title: "Banana Bay",
    lesson: "Follow the bananas across the beach. Higher bananas are a bonus!",
    need: 5,
    platforms: [
      ground(240, 480),
      ground(735, 390),
      ground(1185, 390, 402),
      ground(1640, 400),
      ground(2110, 420),
      [370, 363, 144, 18],
      [760, 351, 156, 18],
      [1580, 363, 156, 18],
    ],
    items: [
      [230, 399],
      [735, 399],
      [1185, 363],
      [1640, 399],
      [2170, 399],
      [370, 315],
      [760, 303],
      [1580, 315],
    ],
    enemies: [],
    checkpoint: [1185, 375],
    finish: [2220, 435],
  },
  {
    title: "The Palm Walk",
    lesson: "Choose the sandy path or the high palm route.",
    need: 5,
    platforms: [
      ground(240, 480),
      ground(720, 360),
      ground(1150, 380),
      ground(1580, 360),
      ground(2030, 380),
      [360, 360, 100, 24],
      [570, 280, 150, 24],
      [800, 220, 160, 24],
      [1050, 280, 170, 24],
      [1330, 346, 170, 24],
      [1670, 360, 180, 24],
      [1920, 270, 170, 24],
    ],
    items: [
      [230, 399],
      [570, 230],
      [800, 170],
      [1050, 230],
      [1150, 399],
      [1330, 298],
      [1580, 399],
      [1920, 220],
      [2100, 399],
    ],
    enemies: [
      [780, 421],
      [1250, 421],
      [1650, 421],
    ],
    checkpoint: [1150, 400],
    finish: [2130, 435],
  },
  {
    title: "Spring Picnic",
    lesson: "Land on a flower spring to bounce into the sky.",
    need: 5,
    platforms: [
      ground(260, 520),
      ground(820, 460),
      ground(1370, 460),
      ground(1970, 540),
      [600, 250, 160, 24],
      [1000, 205, 170, 24],
      [1320, 280, 150, 24],
      [1780, 230, 190, 24],
      [1920, 300, 150, 24],
    ],
    items: [
      [220, 399],
      [430, 290],
      [600, 200],
      [1000, 155],
      [1320, 230],
      [1510, 295],
      [1780, 180],
      [1920, 250],
      [2100, 399],
    ],
    springs: [
      { x: 430, y: 438 },
      { x: 760, y: 438 },
      { x: 1510, y: 438 },
      { x: 1810, y: 438 },
    ],
    enemies: [
      [720, 421],
      [1410, 421],
    ],
    checkpoint: [1370, 400],
    finish: [2130, 435],
  },
  {
    title: "Lagoon Ferries",
    lesson: "Wait for the leaf ferry, then ride across.",
    need: 5,
    platforms: [
      ground(200, 400),
      ground(800, 270),
      ground(1390, 280),
      ground(2040, 380),
      [500, 390, 170, 24],
      [1090, 360, 180, 24],
      [1720, 380, 210, 24],
      [800, 320, 130, 24],
      [1390, 300, 150, 24],
    ],
    moving: [
      { index: 4, range: 95, speed: 0.8 },
      { index: 5, range: 95, speed: 0.65 },
      { index: 6, range: 110, speed: 0.75 },
    ],
    items: [
      [250, 399],
      [500, 340],
      [800, 270],
      [1090, 310],
      [1390, 250],
      [1720, 330],
      [2050, 399],
    ],
    enemies: [
      [850, 421],
      [1430, 421],
    ],
    checkpoint: [1390, 400],
    finish: [2130, 435],
  },
  {
    title: "Butterfly Steps",
    lesson: "Crumbly coral shakes before falling. Keep hopping!",
    need: 5,
    platforms: [
      ground(200, 400),
      ground(1110, 320),
      ground(2050, 360),
      [480, 380, 180, 24],
      [710, 325, 180, 24],
      [900, 380, 160, 24],
      [1390, 370, 180, 24],
      [1590, 305, 180, 24],
      [1800, 370, 180, 24],
    ],
    crumbling: [3, 4, 5, 6, 7, 8],
    items: [
      [250, 399],
      [480, 330],
      [710, 275],
      [900, 330],
      [1110, 399],
      [1390, 320],
      [1590, 255],
      [1800, 320],
      [2100, 399],
    ],
    enemies: [[1150, 421]],
    checkpoint: [1110, 400],
    finish: [2130, 435],
  },
  {
    title: "The Family Picnic",
    lesson: "Springs, ferries and coral steps: bring the picnic home.",
    need: 6,
    platforms: [
      ground(240, 480),
      ground(1060, 340),
      ground(2030, 420),
      [570, 250, 170, 24],
      [805, 320, 190, 24],
      [1330, 260, 170, 24],
      [1580, 320, 180, 24],
      [1790, 365, 170, 24],
    ],
    springs: [
      { x: 410, y: 438 },
      { x: 1170, y: 438 },
    ],
    moving: [{ index: 4, range: 45, speed: 0.6 }],
    crumbling: [6, 7],
    items: [
      [220, 399],
      [410, 290],
      [570, 200],
      [805, 270],
      [1050, 399],
      [1330, 210],
      [1580, 270],
      [1790, 315],
      [2100, 399],
    ],
    enemies: [
      [980, 421],
      [2010, 421],
    ],
    checkpoint: [1060, 400],
    finish: [2130, 435],
  },
];

function garden(title, lesson, player, boxes, targets, hedges = []) {
  const map = Array.from({ length: 8 }, (_, y) =>
    Array.from({ length: 9 }, (_, x) =>
      x === 0 || x === 8 || y === 0 || y === 7 ? "#" : ".",
    ),
  );
  for (const [x, y] of hedges) map[y][x] = "#";
  return {
    title,
    lesson,
    map: map.map((row) => row.join("")),
    player: { x: player[0], y: player[1] },
    boxes: boxes.map(([x, y]) => ({ x, y })),
    targets: targets.map(([x, y]) => ({ x, y })),
  };
}
export const GARDEN_LEVELS = [
  garden(
    "One Little Flower",
    "Stand behind the pot. Push it onto the pink star.",
    [4, 2],
    [[4, 3]],
    [[4, 5]],
  ),
  garden(
    "Around the Pot",
    "Walk around a pot to push it in a new direction.",
    [3, 3],
    [[4, 3]],
    [[6, 4]],
  ),
  garden(
    "A Pair for Nur",
    "Plant two flowers. Leave yourself room to walk.",
    [4, 2],
    [
      [3, 3],
      [5, 3],
    ],
    [
      [3, 5],
      [5, 5],
    ],
  ),
  garden(
    "Through the Hedge",
    "The opening is narrow. Line the pots up first.",
    [4, 2],
    [
      [3, 2],
      [5, 2],
    ],
    [
      [3, 5],
      [5, 5],
    ],
    [
      [1, 4],
      [2, 4],
      [6, 4],
      [7, 4],
    ],
  ),
  garden(
    "The Original Garden",
    "Three pots, three beds. Think about which side to stand on.",
    [4, 4],
    [
      [3, 3],
      [5, 3],
      [5, 4],
    ],
    [
      [2, 5],
      [4, 5],
      [6, 5],
    ],
  ),
  garden(
    "Opposite Corners",
    "Some flowers go up, others down. A can undo every move.",
    [4, 4],
    [
      [3, 3],
      [5, 4],
    ],
    [
      [2, 5],
      [6, 2],
    ],
    [
      [4, 2],
      [4, 3],
      [4, 5],
    ],
  ),
  garden(
    "The Courtyard",
    "Work around the middle hedge. Keep the paths open.",
    [4, 2],
    [
      [3, 3],
      [5, 3],
      [4, 5],
    ],
    [
      [2, 5],
      [6, 5],
      [4, 6],
    ],
    [
      [4, 4],
      [2, 2],
      [6, 2],
    ],
  ),
  garden(
    "A Family Bouquet",
    "One flower for each of you. Solve it together, one push at a time.",
    [4, 2],
    [
      [2, 3],
      [4, 3],
      [6, 3],
      [4, 5],
    ],
    [
      [2, 5],
      [3, 5],
      [5, 5],
      [6, 5],
    ],
    [
      [1, 2],
      [7, 2],
    ],
  ),
];

export const BRICK_LEVELS = [
  {
    title: "Star Chart",
    lesson:
      "Paddle edges steer the ball. Tap A just before a bounce to catch it; B slows the flight.",
    bricks: Array.from({ length: 24 }, (_, k) => [
      134 + (k % 8) * 99,
      105 + Math.floor(k / 8) * 39,
      86,
      25,
    ]),
  },
  {
    title: "Twin Telescopes",
    lesson:
      "Two towers leave an open middle lane. Send the ball up a side, then catch it to choose a new launch.",
    bricks: Array.from({ length: 24 }, (_, k) => [
      [215, 314, 646, 745][k % 4] + (Math.floor(k / 4) % 2 ? 12 : -12),
      99 + Math.floor(k / 4) * 39,
      84,
      25,
    ]),
  },
  {
    title: "The Crystal Constellation",
    lesson:
      "A diamond of stars rewards angled rebounds. Keep a flight going to beat your longest chain.",
    bricks: [2, 4, 6, 6, 4, 2].flatMap((count, row) =>
      Array.from({ length: count }, (_, col) => [
        480 + (col - (count - 1) / 2) * 108,
        96 + row * 39,
        87,
        25,
      ]),
    ),
  },
];

export function levelsFor(id) {
  if (id === "summit") return SUMMIT_LEVELS;
  if (id === "bricks") return BRICK_LEVELS;
  return id === "meadow" ? MEADOW_LEVELS : id === "garden" ? GARDEN_LEVELS : [];
}

export const KEEPSAKES = [
  {
    id: "ribbon",
    owner: "Gaia",
    title: "Gaia’s red ribbon",
    object: "keepsake-ribbon",
    x: 185,
    y: 175,
    story:
      "A little red ribbon, found beneath the ferns. Bean followed its trail.",
  },
  {
    id: "seeds",
    owner: "Nur",
    title: "Nur’s seed pouch",
    object: "keepsake-seeds",
    x: 690,
    y: 435,
    story: "A pocketful of possibilities for the next family garden.",
  },
  {
    id: "compass",
    owner: "Arnaud",
    title: "Arnaud’s star compass",
    object: "keepsake-compass",
    x: 365,
    y: 405,
    story: "Every adventure has a way home. This one points toward the picnic.",
  },
];
