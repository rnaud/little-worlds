import { drawMoonKeeper } from "./native-guardian.js";
import { PixelDrawing } from "./native-actors.js";
const palette = {
  o: "#24263d",
  j: "#3b4164",
  h: "#638bb0",
  H: "#9acdda",
  s: "#f5e1c2",
  S: "#cca69d",
  e: "#24263d",
  c: "#63a67c",
  C: "#357b72",
  l: "#c1df9d",
  t: "#e59bb8",
  T: "#9a618d",
  p: "#9f8dc5",
  b: "#675a9a",
  w: "#fff1da",
};
export function drawNativeCreature(id, frame = 0, small = false) {
  if (id === "moon-keeper") return drawMoonKeeper(frame, small);
  if (id === "winged-unicorn") return unicorn(frame, small);
  const d = new PixelDrawing(small ? 16 : 24, small ? 16 : 24, palette),
    cx = small ? 8 : 12,
    base = small ? 14 : 22;
  const bob = [0, 1, 0, -1][frame];
  if (id === "leaf-slime") {
    const rows = small
      ? [
          "...oooooo...",
          "..ocllllco..",
          ".ocllccclco.",
          "occcccccccco",
          "occecccecCCo",
          "occccccccCCo",
          ".oclllllCCo.",
          "..oooooooo..",
        ]
      : [
          ".....oooooooo.....",
          "...oocllllllcoo...",
          "..oclllllclllllco.",
          ".ocllllccccclllco.",
          "oclllccccccccllcco",
          "occlcccccccccccCCo",
          "occcccccccccccCCCo",
          "occccecccccecCCCCo",
          "occclwccccclwCCCCo",
          "occcccctttcccCCCCo",
          ".occcccccccCCCCC o".replace(" ", ""),
          "..occllllllllCCo..",
          "...oooooooooooo...",
        ];
    d.stamp(
      rows,
      cx - Math.floor(rows[0].length / 2),
      base - rows.length + bob,
    );
    d.line(
      cx,
      base - rows.length + bob,
      cx + 1,
      base - rows.length - 3 + bob,
      "C",
    );
    d.stamp(["..lc", "cllc", ".cc."], cx, base - rows.length - 4 + bob);
    if (frame === 2) {
      d.line(cx - 4, base - 5 + bob, cx - 2, base - 5 + bob, "C");
      d.line(cx + 2, base - 5 + bob, cx + 4, base - 5 + bob, "C");
    }
    if (frame === 3) {
      d.rect(cx - 3, base - 5 + bob, 2, 1, "C");
      d.rect(cx + 3, base - 5 + bob, 2, 1, "C");
    }
  } else if (id === "fern-spirit") {
    const y = small ? 3 : 4;
    d.stamp(
      small
        ? [
            "..oo..oo..",
            ".olcoolco.",
            "olllclllco",
            ".oclclco..",
            "..occco...",
            ".ocllcco..",
            "oclecleco.",
            ".ocllcco..",
            "..occoo...",
            "..o..o....",
          ]
        : [
            "...ooo.....ooo...",
            "..olllo...ollco..",
            ".ollllco.ollllco.",
            "ollllllcoclllllco",
            ".oclllccocclllco.",
            "..occccclccclco..",
            "...occllllcco....",
            "..oclllllllcco...",
            ".oclllleclllcco..",
            ".oclewlcclwelco..",
            "..oclllttlllco...",
            "...ocllllllco....",
            "....occllcco.....",
            ".....occoo.......",
          ],
      cx - (small ? 5 : 8),
      y + bob,
    );
    d.limb(
      [
        [cx - 2, base - 3],
        [cx - 3 + (frame % 2), base],
      ],
      "C",
      1,
    );
    d.limb(
      [
        [cx + 2, base - 3],
        [cx + 3 - (frame % 2), base],
      ],
      "c",
      1,
    );
    if (frame === 2) d.stamp([".lc", "llc", ".c."], cx - 6, y + 4);
  } else {
    const rows = small
      ? [
          "....oooo....",
          "..oohHHhoo..",
          ".ohHHHHHHho.",
          "ohHhHHHhhHho",
          "ohHheeHeeHho",
          "ohHhhHHhhHho",
          ".ohHHhhHHho.",
          "..ohHHHHho..",
          "....oooo....",
        ]
      : [
          ".......oooo......",
          "....ooohHHhoo....",
          "..oohHHHHHHHHoo..",
          ".ohHHHHHHHHHHHho.",
          "ohHHHHHHHhhHHHHho",
          "ohHHhhHHHhhhHHHho",
          "ohHheehHHeehhHHho",
          "ohHhewhHHewhhHHho",
          "ohHHhhHHHhhhHHHho",
          "ohHHHHhhHHHHHHHho",
          ".ohHHHhhhhHHHHho.",
          "..ohHHHHHHHHHho..",
          "....ooohHHhoo....",
          ".......oooo......",
        ];
    d.stamp(rows, cx - Math.floor(rows[0].length / 2), small ? 3 : 4);
    const offset = [0, 1, 2, 1][frame];
    d.stamp([".w.", "wHw", ".H."], cx - 4 + offset, small ? 3 : 5);
    if (frame === 2)
      d.line(cx - 2, small ? 10 : 15, cx + 2, small ? 10 : 15, "o");
    if (frame === 3) d.dot(cx + 4, small ? 5 : 8, "w");
  }
  return d;
}
function unicorn(frame, small) {
  const d = new PixelDrawing(small ? 28 : 40, small ? 20 : 28, palette),
    y = small ? 10 : 15,
    bob = frame % 2;
  // Four wing poses have different silhouettes; the body and rider seat stay put.
  const wings = small
    ? [
        [
          "o.........",
          "owo.......",
          "owwwo.....",
          ".owwwwo...",
          "..owwwwwo.",
          "...ooooooo",
        ],
        ["ooooooo...", "owwwwwwwo.", ".owwwwwwwo", "..owwwwwwo", "...oooooo."],
        [
          "..oooooo.",
          ".owwwwwwo",
          "owwwwwwo.",
          "owwwwo...",
          ".owwo....",
          "..oo.....",
        ],
        [".oooooo..", "owwwwwwwo", ".owwwwwo.", "..owwwwo.", "...oooo.."],
      ]
    : [
        [
          "o..............",
          "owo............",
          "owwwo..........",
          "owwwwwo........",
          ".owwwwwwwo.....",
          "..owwwwwwwwwo..",
          "...owwwwwwwwwwo",
          "....owwwwsssso.",
          ".....oooooooo..",
        ],
        [
          "..oooooooo.....",
          ".owwwwwwwwooo..",
          "owwwwwwwwwwwwoo",
          ".owwwwwwwwwwwwo",
          "..owwwwwwwwwwo.",
          "...owwwsssso...",
          "....oooooooo...",
        ],
        [
          "....oooooooo...",
          "...owwwwwwwwo..",
          "..owwwwwwwwwwo.",
          ".owwwwwwwwwwo..",
          "owwwwwwwwwo....",
          "owwwwwwwo......",
          ".owwwwo........",
          "..owwo.........",
          "...oo..........",
        ],
        [
          "..oooooooo.....",
          ".owwwwwwwwo....",
          "owwwwwwwwwwo...",
          ".owwwwwwwwwwo..",
          "..owwwwwwwwo...",
          "...owwwssso....",
          "....oooooo.....",
        ],
      ];
  d.stamp(
    wings[frame],
    small ? 7 : 10,
    y - (frame === 0 ? (small ? 9 : 13) : frame === 2 ? 2 : small ? 5 : 8),
  );
  const tailX = small ? 3 : 4;
  d.stamp(["..oT", "oTTt", "ottt", ".ott", "..ot"], tailX, y + bob);
  d.stamp(
    small
      ? [
          "..oooooooooo..",
          ".oswwwwwwwsso.",
          "oswwwwwwwwwsso",
          ".ossswwwwssso.",
          "..oooossoooo..",
        ]
      : [
          "...oooooooooooooo...",
          "..oswwwwwwwwwwwwso..",
          ".oswwwwwwwwwwwwwwso.",
          "oswwwwwwwwwwwwwwwsso",
          "oswwwwwwwwwwwwwwwsso",
          ".osssswwwwwwwwsssso.",
          "..oooossooooossooo..",
        ],
    small ? 5 : 6,
    y,
  );
  d.stamp(
    small
      ? [
          "..ot...",
          "..otto.",
          ".oswto.",
          "oswewso",
          "oswwwwso",
          ".osssoeo",
          "..ooo...",
        ]
      : [
          "...ot.....",
          "...ott....",
          "..oswto...",
          ".oswwtto..",
          "oswwwwtto.",
          "oswwewwwso",
          "oswwwwwwso",
          ".oswwwssse",
          "..ossssoo.",
          "...oooo...",
        ],
    small ? 19 : 28,
    y - (small ? 7 : 11),
  );
  d.line(
    small ? 23 : 32,
    y - (small ? 7 : 11),
    small ? 24 : 34,
    y - (small ? 10 : 15),
    "l",
  );
  for (const [x, side] of [
    [small ? 9 : 12, -1],
    [small ? 19 : 28, 1],
  ]) {
    const kick = frame === 0 ? 2 : frame === 2 ? -2 : 0;
    d.limb(
      [
        [x, y + 3],
        [x + side * 2, y + 6],
        [x + side * (2 + kick), y + 7],
      ],
      "s",
      1,
    );
    d.dot(x + side * (2 + kick), y + 8, "T");
  }
  return d;
}
