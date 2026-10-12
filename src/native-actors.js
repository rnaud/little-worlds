// Original native-resolution sprite artwork. These are pixel drawings, not
// reduced illustrations: every stencil cell and line step is one output pixel.
// Coordinates are authored independently for the normal and small character sets.
export const ACTOR_PALETTES = {
  gaia: {
    o: "#222238",
    h: "#c69853",
    H: "#efd18a",
    j: "#956b42",
    s: "#f5ca9e",
    S: "#cc917b",
    e: "#34384b",
    c: "#65b8d0",
    C: "#347caa",
    l: "#b1e1df",
    t: "#e66c70",
    T: "#963c56",
    p: "#397392",
    b: "#664756",
    w: "#fff0cf",
  },
  nur: {
    o: "#222238",
    h: "#292a3d",
    H: "#4c4354",
    j: "#171d30",
    s: "#edbb97",
    S: "#c58478",
    e: "#343043",
    c: "#d6e7dc",
    C: "#648ea9",
    l: "#fcf0d6",
    t: "#397da0",
    T: "#28516d",
    p: "#314e71",
    b: "#503b4c",
    w: "#fff0cf",
  },
  arnaud: {
    o: "#222238",
    h: "#443a43",
    H: "#75604f",
    j: "#292735",
    s: "#e9b78b",
    S: "#bd8270",
    e: "#302c38",
    c: "#426887",
    C: "#293e60",
    l: "#7595a7",
    t: "#d2b27d",
    T: "#85634e",
    p: "#506075",
    b: "#3b3549",
    w: "#fff0cf",
  },
  bean: {
    o: "#2b2939",
    h: "#c9945d",
    H: "#eed09b",
    j: "#936348",
    s: "#efdec0",
    S: "#c4b6a4",
    e: "#211f31",
    c: "#333847",
    C: "#171e31",
    l: "#f5e8d0",
    t: "#dec572",
    T: "#976a43",
    p: "#c9945d",
    b: "#f3e6ce",
    w: "#fff0cf",
  },
};
export class PixelDrawing {
  constructor(w, h, palette) {
    this.width = w;
    this.height = h;
    this.palette = palette;
    this.pixels = new Array(w * h).fill(".");
  }
  dot(x, y, c) {
    if (
      Number.isInteger(x) &&
      Number.isInteger(y) &&
      x >= 0 &&
      y >= 0 &&
      x < this.width &&
      y < this.height
    )
      this.pixels[y * this.width + x] = c;
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) this.dot(x + i, y + j, c);
  }
  stamp(rows, x, y) {
    for (let j = 0; j < rows.length; j++)
      for (let i = 0; i < rows[j].length; i++)
        if (rows[j][i] !== ".") this.dot(x + i, y + j, rows[j][i]);
  }
  line(x, y, tx, ty, c) {
    const dx = Math.abs(tx - x),
      sx = x < tx ? 1 : -1,
      dy = -Math.abs(ty - y),
      sy = y < ty ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.dot(x, y, c);
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
  limb(points, fill, width = 2) {
    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i - 1],
        [tx, ty] = points[i];
      for (let oy = -1; oy <= width; oy++)
        for (let ox = -1; ox <= width; ox++)
          this.line(x + ox, y + oy, tx + ox, ty + oy, "o");
    }
    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i - 1],
        [tx, ty] = points[i];
      for (let oy = 0; oy < width; oy++)
        for (let ox = 0; ox < width; ox++)
          this.line(x + ox, y + oy, tx + ox, ty + oy, fill);
    }
  }
  rgba() {
    const data = new Uint8ClampedArray(this.width * this.height * 4);
    const colors = {};
    for (const [k, v] of Object.entries(this.palette))
      colors[k] = [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
    this.pixels.forEach((c, i) => {
      if (colors[c]) {
        data.set(colors[c], i * 4);
        data[i * 4 + 3] = 255;
      }
    });
    return data;
  }
}
const HEADS = {
  gaia: [
    "....oooooo....",
    "..oojHHHHhoo..",
    ".ojHHHHHHHhho.",
    ".ohHtttttTThh.",
    "ohHHHhhhHHHhho",
    "ojHHhssssshhho",
    "ojHhssssssshho",
    "ojhhsssessesso",
    ".ohhsswssssso.",
    ".ohhssssSssso.",
    "..ohhssSSsoo..",
    "..ojhhsoooho..",
    "...ohho..oho..",
  ],
  nur: [
    "....oooooo....",
    "..oohHHhhhho..",
    ".ohHHHhhhhhho.",
    ".ohHhhhhhhhho.",
    "ohHhhhhhssshho",
    "ohhhssssssshho",
    "ohhhssssssshho",
    "ohhhsssessesso",
    "ohhhsssssssso.",
    "ojhhssssStsso.",
    ".ohhsssSSsso..",
    ".ojhhsooohoo..",
    "..oooo...ooo..",
  ],
  arnaud: [
    "...oo..ooo....",
    "..ohHooHHhoo..",
    ".ohHHHhhHHhho.",
    "ohHHhhhhhhhho.",
    "ohHhhhsshhsho.",
    "ojhhsssssssso.",
    ".ohssssssssso.",
    ".ossssessesso.",
    ".ossssssssSso.",
    "..ojhssssjhho.",
    "..ohjhhhjjhho.",
    "...ohhsShhho..",
    "....ooooooo...",
  ],
};
const MINI_HEADS = {
  gaia: [
    "..oooooo..",
    ".ohHHHHho.",
    "ohHtttThho",
    "ohhsssssho",
    "ohssesesso",
    ".ohssSsso.",
    "..ohssso..",
    "..ohooho..",
  ],
  nur: [
    "..oooooo..",
    ".ohHHhhho.",
    "ohHhhhshho",
    "ohhsssssho",
    "ohhsesesso",
    "ohhssStso.",
    ".ohsssoo..",
    "..oo..oo..",
  ],
  arnaud: [
    "..oo.ooo..",
    ".oHHohHho.",
    "ohHhhhsho.",
    "ohssssssso",
    ".ossesesso",
    ".ohssssho.",
    "..ohhShho.",
    "...ooooo..",
  ],
};
const SIDE_HEADS = {
  gaia: [
    "....oooooo....",
    "..oojHHHHhoo..",
    ".ojHHHHHHHhho.",
    ".ohHtttttTTho.",
    "ohHHHhhhsssso.",
    "ojHHHhhssssso.",
    "ojHHhhsssessso",
    "ojHHhhssssssso",
    ".ojHhhssssSso.",
    ".ohHhsssSsoo..",
    "..ohhhssooo...",
    "...ohhho......",
    "....ooo.......",
  ],
  nur: [
    "....oooooo....",
    "..oohHHhhhho..",
    ".ohHHHhhhhho..",
    "ohHHhhhhssso..",
    "ohHhhhhsssso..",
    "ohhhhhhsssso..",
    "ohhhhhhssessso",
    "ohhhhhhssssso.",
    "ojhhhhhsssSso.",
    ".ojhhhssStso..",
    "..ojhhsssoo...",
    "...oooooo.....",
    "..............",
  ],
  arnaud: [
    "...oo..ooo....",
    "..ohHooHHhoo..",
    ".ohHHHhhHHhho.",
    "ohHHhhhhhhsho.",
    "ohHhhhsssssho.",
    "ojhhsssssssso.",
    ".ohssssssessso",
    ".osssssssssso.",
    ".osjhssssShho.",
    "..ohjhhhhhhho.",
    "..ohjhhSjhho..",
    "...ohjhhhoo...",
    "....ooooo.....",
  ],
};
const BACK_HEADS = {
  gaia: [
    "....oooooo....",
    "..oojHHHHhoo..",
    ".ojHHHHHHHhho.",
    ".ohHtttttTThh.",
    "ohHHHHHHHHHhho",
    "ojHHHHHhhHHhho",
    "ojHHHHHhhHHhho",
    "ojHHHhhhhHHhho",
    ".ohHHHhhHHhho.",
    ".ohHHHhhHHhho.",
    "..ohHHhjHHho..",
    "..ojhhhooho...",
    "...oooo..oo...",
  ],
  nur: [
    "....oooooo....",
    "..oohHHhhhho..",
    ".ohHHHhhhhho..",
    "ohHHHhhhhhhho.",
    "ohHHhhhhhhhhho",
    "ohHhhhhhhhhhho",
    "ohhhhhhhhhhhho",
    "ohhhhhhhhhhhho",
    "ojhhhhhhhjjhho",
    ".ojhhhhhhjjho.",
    "..ojjjjjjjho..",
    "...ooooooo....",
    "..............",
  ],
  arnaud: [
    "...oo..ooo....",
    "..ohHooHHhoo..",
    ".ohHHHhhHHhho.",
    "ohHHhhhhhhhho.",
    "ohHhhhhhhhhhho",
    "ojhhhhhhhhhhho",
    ".ohhhhhhhhhho.",
    ".ojhhhhhhhhho.",
    "..ojhhjjjjho..",
    "..ojjjjjjjo...",
    "...oSSSsso....",
    "....ooooo.....",
    "..............",
  ],
};
const MINI_SIDE_HEADS = {
  gaia: [
    "..oooooo..",
    ".ohHHHHho.",
    "ohHtttTho.",
    "ohHhsssso.",
    "ohHhsessso",
    ".ohhsssso.",
    "..ohsSso..",
    "..ohoo....",
  ],
  nur: [
    "..oooooo..",
    ".ohHHhhho.",
    "ohHhhhhso.",
    "ohhhsssso.",
    "ohhhsessso",
    "ojhhsssso.",
    ".ohhStso..",
    "..ooooo...",
  ],
  arnaud: [
    "..oo.ooo..",
    ".oHHohHho.",
    "ohHhhhsho.",
    "ohssssssso",
    ".osssessso",
    ".ohssssho.",
    "..ohhShho.",
    "...ooooo..",
  ],
};
const MINI_BACK_HEADS = {
  gaia: [
    "..oooooo..",
    ".ohHHHHho.",
    "ohHtttThho",
    "ohHHHHHhho",
    "ojHHhhhHho",
    ".ohHhhHho.",
    "..ojhhho..",
    "..ohooho..",
  ],
  nur: [
    "..oooooo..",
    ".ohHHhhho.",
    "ohHHhhhhho",
    "ohHhhhhhho",
    "ojhhhhhhho",
    "ojhhhhjhho",
    ".ojjjjjo..",
    "..ooooo...",
  ],
  arnaud: [
    "..oo.ooo..",
    ".oHHohHho.",
    "ohHhhhhho.",
    "ohhhhhhho.",
    ".ojhhhho..",
    ".ojjjjjo..",
    "..oSSso...",
    "...ooo....",
  ],
};

// Arms and legs describe contact / recoil / passing / flight, rather than
// translating a static character. Feet and head volumes remain stable.
function pose(frame, small = false) {
  const run = frame >= 4 && frame <= 7 ? frame - 4 : -1;
  const down =
    (frame >= 16 && frame <= 18) ||
    frame === 27 ||
    frame === 31 ||
    frame === 32;
  const up =
    (frame >= 19 && frame <= 21) ||
    frame === 28 ||
    frame === 33 ||
    frame === 34;
  return {
    run,
    down,
    up,
    crouch: frame === 8,
    air: [9, 10, 11].includes(frame),
    dash: frame === 11,
    cast: [12, 13, 31, 32, 33, 34].includes(frame),
    cheer: frame === 14 || frame === 15,
    wall: frame >= 35,
    ride: frame >= 22 && frame <= 25,
    push: frame >= 26 && frame <= 28,
    carry: frame === 29 || frame === 30,
    bob: run === 1 || run === 3 ? 1 : 0,
    step:
      run < 0
        ? frame === 17 || frame === 20 || frame === 29
          ? 1
          : frame === 18 || frame === 21 || frame === 30
            ? -1
            : 0
        : [3, 1, -3, -1][run],
  };
}
function human(id, frame, small = false) {
  const d = new PixelDrawing(
      small ? 16 : 24,
      small ? 24 : 32,
      ACTOR_PALETTES[id],
    ),
    q = pose(frame),
    girl = id === "gaia";
  const cx = small ? 8 : 12,
    foot = small ? 22 : 30,
    hip = small ? (q.carry ? 20 : girl ? 18 : 17) : girl ? 25 : 23,
    shoulder = small ? (q.carry ? 16 : girl ? 14 : 12) : girl ? 20 : 17;
  let bob =
    q.bob +
    (q.crouch ? 2 : 0) -
    (q.cheer && frame === 15 ? 1 : 0) +
    (frame === 24 ? 1 : 0);
  const step = small ? Math.sign(q.step) * 2 : q.step;
  // Far limbs are shadowed, with a one-pixel gap at the passing pose.
  let legs = [
    [
      [cx - 3, hip],
      [cx - 3 - step, hip + 3],
      [cx - 3 - step, foot - 1],
    ],
    [
      [cx + 2, hip],
      [cx + 2 + step, hip + 3],
      [cx + 2 + step, foot - 1],
    ],
  ];
  if (q.air)
    legs =
      frame === 9
        ? [
            [
              [cx - 2, hip],
              [cx - 5, hip + 3],
              [cx - 7, hip + 3],
            ],
            [
              [cx + 2, hip],
              [cx + 4, hip + 2],
              [cx + 4, foot - 2],
            ],
          ]
        : frame === 11
          ? [
              [
                [cx - 2, hip],
                [cx - 6, hip + 1],
                [cx - 8, hip + 1],
              ],
              [
                [cx + 2, hip],
                [cx + 1, hip + 3],
                [cx - 3, hip + 5],
              ],
            ]
          : [
              [
                [cx - 2, hip],
                [cx - 4, hip + 3],
                [cx - 5, foot - 1],
              ],
              [
                [cx + 2, hip],
                [cx + 4, hip + 2],
                [cx + 5, foot - 2],
              ],
            ];
  if (q.ride)
    legs = [
      [
        [cx - 3, hip - 2],
        [cx - 5, hip],
        [cx - 4, hip + 3],
      ],
      [
        [cx + 2, hip - 2],
        [cx + 5, hip],
        [cx + 5, hip + 3],
      ],
    ];
  if (q.wall)
    legs = [
      [
        [cx - 2, hip],
        [cx - 1, hip + 3],
        [cx + 2, foot - 1],
      ],
      [
        [cx + 2, hip],
        [cx + 5, hip + 1],
        [cx + 5, hip + 3],
      ],
    ];
  if (q.carry && small) {
    legs = [
      [
        [cx - 2, hip],
        [cx - 2 - step, foot - 1],
        [cx - 2 - step, foot],
      ],
      [
        [cx + 2, hip],
        [cx + 2 + step, foot - 1],
        [cx + 2 + step, foot],
      ],
    ];
  }
  for (const [n, points] of legs.entries()) {
    d.limb(points, girl ? (n ? "s" : "S") : "p", small ? 1 : 2);
    const [x, y] = points.at(-1);
    d.stamp(small ? ["ooo", "obo"] : ["oooo", "obbo", "oloo"], x - 1, y);
  }
  let left = [
      [cx - 4, shoulder + bob],
      [cx - 5 - step, shoulder + 3 + bob],
      [cx - 4 - step, shoulder + 5 + bob],
    ],
    right = [
      [cx + 4, shoulder + bob],
      [cx + 5 + step, shoulder + 3 + bob],
      [cx + 4 + step, shoulder + 5 + bob],
    ];
  if (q.cast || q.push) {
    left = [
      [cx - 4, shoulder + bob],
      [cx - 3, shoulder + 3],
      [cx, shoulder + 2],
    ];
    right = [
      [cx + 4, shoulder],
      [cx + 6, shoulder + 1],
      [cx + (small ? 6 : 8), shoulder + (frame === 13 ? 0 : 2)],
    ];
  }
  if (q.cheer || q.carry) {
    left = [
      [cx - 4, shoulder],
      [cx - 6, shoulder - 2],
      [cx - 6, shoulder - 5],
    ];
    right = [
      [cx + 4, shoulder],
      [cx + 6, shoulder - 2],
      [cx + 6, shoulder - 5],
    ];
  }
  if (q.air && !q.dash) {
    left = [
      [cx - 4, shoulder],
      [cx - 6, shoulder - 1],
      [cx - 7, shoulder - 3],
    ];
    right = [
      [cx + 4, shoulder],
      [cx + 6, shoulder - 1],
      [cx + 6, shoulder - 4],
    ];
  }
  if (q.carry && small) {
    // Compact, raised-arm pose: hands meet the paddle while the face stays below it.
    left = [
      [cx - 4, shoulder],
      [cx - 6, 10],
      [cx - 6, 4],
    ];
    right = [
      [cx + 4, shoulder],
      [cx + 6, 10],
      [cx + 6, 4],
    ];
  }
  if (q.wall) {
    left = [
      [cx - 4, shoulder],
      [cx + 2, shoulder - 4],
      [cx + 6, shoulder - 5],
    ];
    right = [
      [cx + 4, shoulder],
      [cx + 6, shoulder - 3],
      [cx + 6, shoulder - 6 + (frame === 36 ? 1 : 0)],
    ];
  }
  if (q.ride) {
    left = [
      [cx - 4, shoulder],
      [cx - 5, shoulder + 3],
      [cx - 2, shoulder + 4],
    ];
    right = [
      [cx + 4, shoulder],
      [cx + 5, shoulder + 3],
      [cx + 2, shoulder + 4],
    ];
  }
  if (q.down && (q.cast || q.push)) {
    const reach = frame === 32 ? 6 : 4;
    left = [
      [cx - 4, shoulder],
      [cx - 4, shoulder + 3],
      [cx - 2, shoulder + reach],
    ];
    right = [
      [cx + 4, shoulder],
      [cx + 4, shoulder + 3],
      [cx + 2, shoulder + reach],
    ];
  }
  if (q.up && (q.cast || q.push)) {
    const reach = frame === 34 ? 6 : 4;
    left = [
      [cx - 4, shoulder],
      [cx - 5, shoulder - 2],
      [cx - 5, shoulder - reach],
    ];
    right = [
      [cx + 4, shoulder],
      [cx + 5, shoulder - 2],
      [cx + 5, shoulder - reach],
    ];
  }
  if (frame === 23)
    right = [
      [cx + 4, shoulder],
      [cx + 5, shoulder + 2],
      [cx + 4, shoulder + 3],
    ];
  if (frame === 25)
    right = [
      [cx + 4, shoulder],
      [cx + 6, shoulder - 1],
      [cx + 6, shoulder - 4],
    ];
  const arm = (points) => {
    d.limb(points, "S", small ? 1 : 2);
    const [x, y] = points.at(-1);
    d.rect(x, y, small ? 1 : 2, small ? 2 : 2, "s");
  };
  arm(left);
  const torso = small
    ? girl
      ? [
          ".oooooo.",
          "occllcCo",
          "occccCCo",
          "occccCCo",
          "occccCCo",
          "ollllllo",
          ".oooooo.",
        ]
      : id === "nur"
        ? [
            ".oooooo.",
            "ocltclCo",
            "ocltclCo",
            "ocltclCo",
            "ocltclCo",
            ".oooooo.",
          ]
        : [
            ".oooooo.",
            "occlcCCo",
            "occtcCCo",
            "occccCCo",
            "occTcCCo",
            ".oooooo.",
          ]
    : girl
      ? [
          "..oooooo..",
          ".occllCCo.",
          "occcccCCCo",
          "occcccCCCo",
          ".occccCo..",
          ".occccCo..",
          "occcccCCCo",
          "occcccCCCo",
          "ollllllCCo",
          ".oooooooo.",
        ]
      : id === "nur"
        ? [
            "..oooooo..",
            ".oclllcCo.",
            "oclctlctCo",
            "oclctlctCo",
            "oclctlctCo",
            "oclctlctCo",
            "oclctlctCo",
            ".occccCCo.",
            "..oooooo..",
          ]
        : [
            "..oooooo..",
            ".oclllcCo.",
            "occcclCCCo",
            "occctcCCCo",
            "occcclCCCo",
            "occcclCCCo",
            "occctcCCCo",
            ".occccCCo.",
            "..oooooo..",
          ];
  d.stamp(torso, cx - (small ? 4 : 5), shoulder - 2 + bob);
  arm(right);
  // A short neck keeps profile chins and bobbed hair connected to the collar.
  d.rect(cx - 1, shoulder - 4 + bob, 3, 3, "S");
  d.rect(cx - 1, shoulder - 3 + bob, 2, 2, "s");
  const side =
    q.run >= 0 ||
    q.air ||
    q.wall ||
    (q.push && !q.down && !q.up) ||
    (q.cast && !q.down && !q.up);
  const heads = q.up
    ? small
      ? MINI_BACK_HEADS
      : BACK_HEADS
    : side
      ? small
        ? MINI_SIDE_HEADS
        : SIDE_HEADS
      : small
        ? MINI_HEADS
        : HEADS;
  let head = heads[id].map((r) => (q.down ? r.replaceAll("e", "s") : r));
  if (frame === 2) head = head.map((r) => r.replaceAll("e", "S"));
  // A single side bang and a two-color headband retain Gaia's identity at 1×.
  const headY = (small ? (q.carry ? 7 : girl ? 5 : 3) : girl ? 7 : 2) + bob;
  d.stamp(head, cx - (small ? 5 : 7) + (q.dash ? 2 : 0), headY);
  if (q.down) {
    const eyeY = headY + (small ? 4 : 7);
    d.dot(cx - 2, eyeY, "e");
    d.dot(cx + 2, eyeY, "e");
  }
  if (frame === 1 && !q.up)
    d.dot(cx + (small ? 3 : 4), headY + (small ? 6 : 9), "w");
  if (frame === 3 && !q.up)
    d.dot(cx + (small ? 2 : 3), headY + (small ? 7 : 10), "t");
  if (q.cast && !q.push) {
    const [hx, hy] = right.at(-1),
      reach = small ? 2 : 3;
    d.line(hx + 1, hy, hx + reach, hy - 4, "T");
    d.dot(hx + reach, hy - 5, "w");
    d.dot(hx + reach - 1, hy - 4, "t");
    d.dot(hx + reach + 1, hy - 4, "t");
  }
  return d;
}
function seatedDog(frame, small) {
  const d = new PixelDrawing(
      small ? 24 : 32,
      small ? 18 : 24,
      ACTOR_PALETTES.bean,
    ),
    nod = frame === 24 ? 1 : 0,
    hx = small ? 11 : 13,
    hy = (small || frame === 15 ? 0 : 1) + nod;
  // Upright chest, folded hind legs and fine front paws, drawn from Bean's sitting reference.
  d.line(small ? 9 : 11, small ? 12 : 17, small ? 5 : 7, small ? 14 : 20, "j");
  d.line(
    small ? 5 : 7,
    small ? 14 : 20,
    small ? 4 : 5,
    (small ? 16 : 22) - (frame === 15 ? 1 : 0),
    "h",
  );
  d.stamp(
    small
      ? [
          "..ohho...",
          ".ohsHho..",
          ".ohssHo..",
          "ohHssHho.",
          "ohHssHho.",
          "ohHssHho.",
          ".ohssho..",
          "..ohoo...",
          ".ooo.ooo.",
          ".oso.osso",
        ]
      : [
          "....ohho....",
          "...ohHhho...",
          "..ohHsHho...",
          "..ohHssHho..",
          ".ohHsssHho..",
          ".ohHsssHho..",
          "ohHHsssHHho.",
          "ohHHsssHHho.",
          "ohHHsssHHho.",
          ".ohHsssHho..",
          "..ohooohoo..",
          "...o...o....",
          ".oooo.oooo..",
          ".osssoossso.",
        ],
    small ? 8 : 10,
    (small ? 7 : 9) + nod,
  );
  // Join the muzzle and collar to the upright chest even in the lifted-head
  // celebration pose. The neck has its own fawn/white pixels below the collar.
  d.stamp(
    small
      ? [".ohho", "ohsHo", "ohsHo", "ohsHo", ".osso"]
      : ["..ohho", ".ohsHo", ".ohsHo", "ohssHo", "ohssho", ".osso."],
    hx + (small ? 1 : 2),
    hy + 4,
  );
  d.stamp(
    small
      ? ["ohho....", "ojHhoo..", ".oHHHho.", ".oHeHsoo", "..ohssse", "...oooo."]
      : [
          "ohho.......",
          "ojHhoo.....",
          ".ohHHHhoo..",
          "..ohHeHssso",
          "...ohssssse",
          "....oooooo.",
        ],
    hx,
    hy,
  );
  d.rect(hx + (small ? 2 : 3), hy + 6, small ? 4 : 6, 2, "c");
  d.dot(hx + (small ? 4 : 6), hy + 7, "t");
  if (frame === 23) d.dot(hx + (small ? 3 : 5), hy + 3, "h");
  if (frame === 25)
    d.limb(
      [
        [small ? 15 : 20, small ? 11 : 15],
        [small ? 18 : 24, small ? 8 : 11],
      ],
      "s",
      1,
    );
  return d;
}
function dog(frame, small = false) {
  if (frame === 15 || (frame >= 22 && frame <= 25))
    return seatedDog(frame, small);
  const d = new PixelDrawing(
      small ? 24 : 32,
      small ? 18 : 24,
      ACTOR_PALETTES.bean,
    ),
    q = pose(frame);
  const y = small ? 8 : 11,
    cx = small ? 11 : 15,
    ground = small ? 16 : 22;
  const gallop = frame >= 4 && frame <= 7,
    phase = gallop ? frame - 4 : 0;
  const sniff = frame === 8 || frame === 9,
    play = frame === 11,
    sit = frame === 15 || q.ride;
  const airborne = frame === 12 || frame === 13 || frame === 14;
  const down = q.down,
    up = q.up;
  if (down || up) {
    const x = small ? 9 : 12;
    d.stamp(
      small
        ? [".oooo.", "ohHhho", "ohHhho", "ohsHho", "ohssho", ".ohho."]
        : [
            "..oooo..",
            ".ohHHho.",
            "ohHHHhho",
            "ohhssHho",
            "ohssssho",
            ".ohssho.",
            "..ohho..",
          ],
      x - 1,
      y - 1,
    );
    d.limb(
      [
        [x, y + 4],
        [x - 1 + (frame % 3 === 1 ? 1 : 0), ground - 1],
      ],
      "h",
      1,
    );
    d.limb(
      [
        [x + 4, y + 4],
        [x + 4 - (frame % 3 === 2 ? 1 : 0), ground - 1],
      ],
      "s",
      1,
    );
    d.stamp(
      small
        ? [
            "o....o",
            "oh..ho",
            ".ohho.",
            "ohHHho",
            up ? "ohHHho" : "oesseo",
            up ? ".ohho." : ".ossso",
            up ? "..oo.." : "..oeo.",
          ]
        : [
            "oo....oo",
            "oh....ho",
            ".ohHHho.",
            "ohHHHHho",
            up ? "ohHHHHho" : "oesssseo",
            up ? ".ohhhho." : ".osssso.",
            up ? "..ohho.." : "..osso..",
            up ? "...oo..." : "...eo...",
          ],
      x - 1,
      small ? 2 : 3,
    );
    if (frame >= 26) {
      const lift = [32, 34].includes(frame) ? 3 : 1;
      d.limb(
        [
          [x, y + 2],
          [x - 2, y - lift],
        ],
        "s",
        1,
      );
      d.limb(
        [
          [x + 4, y + 2],
          [x + 6, y - lift],
        ],
        "h",
        1,
      );
    }
    return d;
  }
  const stride = gallop
    ? small
      ? [2, 0, -2, -1][phase]
      : [4, 1, -4, -1][phase]
    : 0;
  const bob =
    gallop && (phase === 1 || phase === 3) ? -1 : frame === 24 ? 1 : 0;
  const rump = small ? 4 : 6,
    front = small ? 15 : 21;
  let legs = [
    [
      [rump + 2, y + 3],
      [rump + 1 - stride, y + 5],
      [rump - stride, ground],
    ],
    [
      [rump + 4, y + 3],
      [rump + 4 + stride, y + 5],
      [rump + 3 + stride, ground],
    ],
    [
      [front - 1, y + 4],
      [front - stride, y + 6],
      [front - stride, ground],
    ],
    [
      [front + 1, y + 3],
      [front + 1 + stride, y + 6],
      [front + 1 + stride, ground],
    ],
  ];
  if (airborne)
    legs = legs.map((p, n) => [
      p[0],
      [p[0][0] + (n % 2 ? 3 : -3), y + 5],
      [p[0][0] + (n % 2 ? 5 : -5), y + 5],
    ]);
  if (sit)
    legs = [
      [
        [rump + 4, y + 3],
        [rump + 2, ground - 1],
        [rump + 5, ground],
      ],
      [
        [front - 1, y + 2],
        [front - 1, ground],
        [front + 1, ground],
      ],
    ];
  for (const [n, points] of legs.entries()) {
    d.limb(points, n % 2 ? "h" : "j", 1);
    const [x, yy] = points.at(-1);
    d.rect(x, yy, 2, 1, "s");
  }
  d.line(rump, y + 1, rump - 2, y - 1, "j");
  d.line(rump - 2, y - 1, rump - 3, y - 4 + (frame % 2), "h");
  d.stamp(
    small
      ? [
          "..ooooooo...",
          ".ohHHHHHhoo.",
          "ohHHHHHHHhho",
          ".ohhhhssshho",
          "..ooooossso.",
          ".......ooo..",
        ]
      : [
          "..ooooooooooo...",
          ".ohHHHHHHHHHhoo.",
          "ohHHHHHHHHHHHhho",
          "ohHHHhhhhHHHHhho",
          ".ojhhhooohssshho",
          "..oooo...ohssho.",
          "..........oooo..",
        ],
    rump - 1,
    y + bob - (play ? 1 : 0),
  );
  // Long neck, deep white chest, fine legs and tucked belly: an Italian greyhound.
  const hx = small ? 16 : 23,
    hy =
      (small ? 3 : 4) +
      (sniff ? (small ? 6 : 9) : play ? 4 : 0) +
      (frame === 10 ? -1 : 0) +
      bob;
  if (!sniff)
    d.stamp(
      small
        ? [".ohho", "ohHho", "ohsHo", "ohsHo", "ohsso", ".oso."]
        : [
            "..ohho",
            "..ohHo",
            ".ohHHo",
            ".ohsHo",
            "ohHsso",
            "ohssso",
            ".osso.",
            "..oo..",
          ],
      hx - 3,
      hy + 3,
    );
  d.stamp(
    small
      ? ["ohho....", "ojHhoo..", ".oHHHho.", ".oHeHsoo", "..ohssse", "...oooo."]
      : [
          ".ohho......",
          "ojjHhoo....",
          ".ohHHHhoo..",
          "..oHHHHHho.",
          "..oHHeHssso",
          "...ohssssse",
          "....oooooo.",
        ],
    hx - 3,
    hy,
  );
  if (!sniff) {
    d.rect(hx - 2, hy + (small ? 5 : 6), small ? 4 : 5, 2, "c");
    d.dot(hx + 1, hy + (small ? 5 : 6), "t");
  }
  if (frame === 1) d.dot(hx + (small ? 3 : 5), hy + (small ? 5 : 6), "t");
  if (frame === 3) d.line(hx - 2, hy, hx - 4, hy - 1, "h");
  if (frame === 2) d.line(hx - 1, hy + 2, hx + 1, hy + 1, "H");
  if (frame === 9)
    d.limb(
      [
        [front, y + 4],
        [front + 2, ground - 2],
      ],
      "s",
      1,
    );
  if (frame === 12)
    d.limb(
      [
        [front, y + 4],
        [front + 3, y + 2],
      ],
      "s",
      1,
    );
  if (frame === 14)
    d.limb(
      [
        [front, y + 4],
        [front + 2, ground - 1],
      ],
      "s",
      1,
    );
  if ([23, 25, 26, 29, 30, 35, 36].includes(frame)) {
    const reach =
      frame === 29
        ? 7
        : frame === 30
          ? 6
          : frame === 25 || frame === 36
            ? 5
            : 1;
    d.limb(
      [
        [front - 1, y + 3],
        [front + 2, y + 1],
        [front + 3, y - reach],
      ],
      "s",
      1,
    );
    if (frame === 29 || frame === 30)
      d.limb(
        [
          [rump + 3, y + 3],
          [rump + 2, ground - 2],
        ],
        "h",
        1,
      );
  }
  if (frame === 22) d.line(rump, y, rump - 2, y - 2, "H");
  return d;
}
export function drawNativeActor(id, frame = 0, small = false) {
  return id === "bean" ? dog(frame, small) : human(id, frame, small);
}
export function drawNativeKart(id, frame = 0, small = false) {
  const d = new PixelDrawing(
      small ? 16 : 24,
      small ? 20 : 32,
      ACTOR_PALETTES[id],
    ),
    cx = small ? 8 : 12;
  const lean = frame === 1 ? -1 : frame === 2 ? 1 : 0;
  // Separately authored rear view, with a stable axle and tire contact points.
  const y = small ? 11 : 19;
  d.stamp(
    small
      ? [
          "ooo........ooo",
          "obo........obo",
          "obo.oooooo.obo",
          "oboocccccCoobo",
          "ooooccccCCoooo",
          "...ooooooo....",
        ]
      : [
          "oooo............oooo",
          "obbo............obbo",
          "obbo..oooooooo..obbo",
          "obbo.occlllllCo.obbo",
          "obbooccccccccCCoobbo",
          "obboocccccccCCCoobbo",
          "ooooocccCCCCCCCooooo",
          "....oooooooooooo....",
        ],
    small ? 1 : 2,
    y,
  );
  d.stamp(
    small
      ? [".oooooo.", "occllcCo", "occttcCo", ".oooooo."]
      : [
          "..oooooooo..",
          ".occllllCCo.",
          "occccccccCCo",
          "occcttttCCCo",
          ".oooooooooo.",
        ],
    cx - (small ? 4 : 6) + lean,
    y - 2,
  );
  if (id === "bean") {
    const head = small
      ? [
          "oo....oo",
          "oh....ho",
          ".ohHHho.",
          "ohHHHHho",
          "ohHHHHho",
          ".ohhhho.",
          "..occo..",
        ]
      : [
          "oo........oo",
          "ojho....ohho",
          ".ohho..ohho.",
          "..ohHHHHho..",
          ".ohHHHHHHho.",
          ".ohHHHHHHho.",
          "..ohhhhhho..",
          "...occco....",
          "....oto.....",
        ];
    d.stamp(head, cx - (small ? 4 : 6) + lean, small ? 2 : 6);
  } else {
    const head = (small ? MINI_BACK_HEADS : BACK_HEADS)[id];
    d.stamp(head, cx - (small ? 5 : 7) + lean, small ? 1 : 3);
  }
  if (frame === 3) {
    d.stamp(
      small
        ? [".w..w.", "twtwtw", ".t..t."]
        : [
            "..w....w..",
            ".wtw..wtw.",
            "ttwttttwtt",
            ".ttt..ttt.",
            "..t....t..",
          ],
      cx - (small ? 3 : 5),
      small ? 17 : 27,
    );
  }
  return d;
}
export function drawingCanvas(d) {
  const canvas = document.createElement("canvas");
  canvas.width = d.width;
  canvas.height = d.height;
  const ctx = canvas.getContext("2d");
  ctx.putImageData(new ImageData(d.rgba(), d.width, d.height), 0, 0);
  return canvas;
}
