# Little Worlds — the family arcade

Seven original, bite-sized 2D games, rendered with Three.js and an orthographic camera. Built for Gaia and family play, with the unicorn, woodland, and banana motifs from the existing Rainbow Flight project. The family party includes Gaia (5, blonde), Bean (a light-brown Italian greyhound), Nur (Italian, dark bob), and Arnaud (French, 39). Choose a character through Players on the shelf; the choice persists on the device. The current character sheets use the supplied family photos as likeness references: Gaia’s loose sandy-blonde hair, red headband and blue dress; Nur’s dark bob and striped blouse; Arnaud’s wavy hair, beard and navy shirt; Bean’s fawn coat, white chest, muzzle and paws, and black collar. The original photographs are not copied into the game or its public assets. The original game is preserved at `/rainbow-flight/`.

## Run

Requires Node 20.19+ or 22.12+.

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

Vite prints the local and LAN URLs. Open the LAN URL from a phone on the same network for touch play. Serve the `build/` output with any static HTTP host. The production build bundles Three.js locally; all graphics and fonts use local code and system resources; no external asset requests are needed.

## Games

| Game              | Genre                | Finish condition                                                                          |
| ----------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| Cloudberry Climb  | Precision platformer | Collect three stars and reach the summit flag; jump, wall-slide/jump and directional dash |
| Banana Meadows    | Classic platformer   | Six stages: collect bananas, ride ferries, bounce on flower springs and reach the cottage |
| The Lantern Woods | Top-down adventure   | Find a key, unlock the gate, recover three lanterns and return to the shrine              |
| Rainbow Rally     | Mode 7 style racer   | Finish an 1,800 m route; steer, boost, brake and avoid puddles                            |
| Starlight Bounce  | Brick breaker        | Clear all 24 bricks; paddle, launch and slow-motion assist                                |
| Pocket Garden     | Push-block puzzle    | Eight progressively harder gardens, from one pot to four; unlimited undo and reset        |
| Unicorns in Orbit | Space shooter        | Clear three waves; move, fire and use a rechargeable shield                               |

These are small complete games with authored levels, not full commercial-scale campaigns. Inspirations are genre conventions, with original names and drawn assets. Banana Meadows supports a second family helper, with shared collectibles and free recovery; the other games are single player, designed for taking turns on the same device.

## New journeys and family play

Banana Meadows has six separate stages: Banana Bay, The Palm Walk, Spring Picnic, Lagoon Ferries, Butterfly Steps and The Family Picnic. Each introduces or combines routes, springs, moving leaf platforms and crumbling coral. Checkpoints and unlimited retries remain available. All six have been completed in both difficulties using normal movement controls without retries in deterministic checks.

Pocket Garden has eight authored puzzles. The first takes two moves; later gardens introduce pairs, hedges, corners and four-pot planning. Every puzzle has a verified legal solution. Stages are open from the start, with a Next stage flow and per-stage progress saved locally.

In The Lantern Woods, approach pawprints and press A to ask Bean to investigate. Bean independently travels to and sniffs out Gaia’s ribbon, Nur’s seeds and Arnaud’s compass. Playing as Bean lets you discover them yourself. Two discoveries after opening the gate reveal a physical woodland shortcut; all three appear in the keepsake album. They are optional and do not replace the main lantern quest.

For Meadows co-op, enable **Play together** in the cartridge setup. Choose a human family helper. Controller 1 drives the lead and controller 2 drives the helper; both collect shared bananas. Alternatively, enable **Touch + one controller**: Gaia uses touch and a parent uses the controller. Keyboard lead: arrows/Space/Shift; helper: WASD/F/G, Q to return. Controller Y returns the helper. Falling or being left behind recalls the helper without costing the lead a retry. Bean follows the lead with his own movement.

## GitHub Pages

The deployment workflow in `.github/workflows/pages.yml` tests and builds every push or pull request to `main`, then publishes successful main-branch builds with GitHub Pages. Repository settings must use **GitHub Actions** as the Pages source. It follows the [GitHub Pages custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

The build reads `PAGES_BASE` so artwork, scripts and the sprite studio resolve correctly under a repository URL. To verify locally:

```sh
PAGES_BASE=/little-worlds/ npm run build
PAGES_BASE=/little-worlds/ npm run preview
```

Open the printed `/little-worlds/` URL. Original family photographs are not included. The source repo contains generated artwork and first-name family characters.

## Controls and access

- Keyboard: arrows or WASD, Space/Z/Enter for A, X/Shift for B. Escape/P pauses, R restarts.
- Touch: a sliding eight-way direction pad with a neutral center and two action buttons. Keep one thumb down to change direction; a second touch can jump, cast, boost or fire. Canceled touches are released immediately.
- Standard-mapped controller: stick or D-pad, south button A, east/west button B, Start pauses, Select restarts. Navigate the spatial cartridge shelf and every menu with directions and A. Hold a direction to repeat. B closes dialogs or returns to the shelf; focus returns to the selected cartridge. Players, difficulty, sound, album, stage selection, co-op setup, pause, restart, victory and replay are accessible with a controller. The optional name editor includes an on-screen letter keyboard. Browser Gamepad API availability varies; press a controller button to wake it.
- Gentle mode: available on the shelf, on by default. More forgiving jumps, harmless adventure/shooter hits, unlimited brick-breaker balls, slower threats. Platformers always offer unlimited retries and checkpoints.
- Sound is on by default and begins on play after browser interaction. Every game has its own original chip melody and action effects. Mute from the header or pause menu; the preference is saved. Muting or pausing stops scheduled audio immediately.
- Completed stages, best stage times, garden move counts, collected keepsakes, character, co-op settings, name, and gentle mode save to this browser’s localStorage. No account, analytics, or backend. Storage failures fall back to session-only play.
- Keyboard focus styles, semantic buttons, reduced-motion UI support, automatic pause on blur, portrait letterboxing, and landscape touch controls. Gameplay itself requires visual interaction and WebGL.

## Structure

- `src/catalog.js`: game titles, instructions and shelf metadata.
- `src/characters.js`, `src/animation.js`: generated family sheets, named animation clips and gameplay-driven pose selection.
- `src/creatures.js`, `src/objects.js`, `src/world-art.js`: animated creatures, interactive objects, foreground props and eight environments.
- `src/sprite-pipeline.js`, `src/prepared-art.js`: native palette/alpha normalization and compact atlas loading.
- `src/art.js` and `src/pixels.js`: shelf covers and code-authored fallback art.
- `src/companions.js`, `src/navigation.js`: Bean’s independent movement and safe garden routing.
- `src/music.js`: original quiet chip themes.
- `sprite-lab.html`: live animation and native-frame inspection studio.
- `src/engine.js`: pooled Three.js drawing primitives, unified input and synthesized audio.
- `src/games.js`: seven game implementations; pure game state separated from rendering.
- `src/main.js`: shelf, lifecycle, pause/retry/win overlays, profile and persistence.
- `tests/arcade.test.js`: deterministic mechanics, level reachability and win/loss checks.
- `public/rainbow-flight/`: preserved original game.

For a new world, add a catalog entry and a world class with `update(dt, input)` and `draw(painter)`, then register it in `createGame`. Player names can be changed using the avatar; edit the catalog for additional family themes. The art preparation command below rebuilds the native atlas after source artwork changes.

## Browser regression checks

With the dev server running in another terminal:

```sh
npx playwright install chromium
npm run test:browser
npm run test:pixels
npm run test:animation
npm run test:input
npm run test:victory
npm run test:audio
npm run test:render
npm run test:journey
npm run test:platform
npm run test:arcade-journey
npm run test:assets
npm run test:controller
npm run test:campaign
npm run test:meadow
npm run test:coop
npm run test:discoveries
# Optional, with Playwright WebKit and Firefox installed:
npm run test:cross-browser
```

The browser suite opens all seven games and checks pause/resume, filtering, profile and progress persistence, keyboard input, simulated standard gamepad Start behavior, and simultaneous touch movement/jumping. It saves desktop, portrait, and landscape screenshots in `tests/artifacts/`. The pixel-grid suite verifies 1:1 texture pixels and integer geometry in all seven games, plus integer display alignment at device pixel ratios 1, 1.25 and 2 in desktop, portrait and landscape, including a 320-pixel-wide viewport. It also checks the actual image fit, integer enlargement and physical-pixel alignment of shelf covers and family portraits. Set `ARCADE_URL` for another server or `BROWSER_EXECUTABLE` to use an existing Chromium installation. The cross-browser suite accepts `BROWSER_ENGINES=webkit` or `firefox` and an optional matching executable path. Source-module inspection suites require the dev server; `test:browser` also runs against the production preview. Simulated input checks do not replace testing a physical controller on your target device.

`npm run format` formats the authored source. Production output goes to `build/`; the previously tracked `dist/` files remain the untouched original Rainbow Flight.

## Pixel-art rendering

The Three.js framebuffer is exactly 320×180 on every device. One art pixel maps to one framebuffer pixel. Sprite size variants are rasterized to integer dimensions once and cached; at runtime every texture texel maps 1:1 onto that grid. All edges snap to integer pixels, including odd-width sprites. Curves use binary pixel masks, lines use Bresenham steps, and transparency uses binary screen-aligned dithering. There are no rotated meshes, filtered edges, or fractional texture scaling. The canvas enlarges only by whole physical-device-pixel multiples and letterboxes unused space; it never stretches to fill the stage. Shelf artwork follows integer enlargement too. DOM text and controls remain normal accessible browser UI, outside the game artwork grid. The runtime art uses integer pixel coordinates and limited 16-bit-inspired palettes. Family animation has 37 distinct poses per character, with named clips and nonuniform frame timing. Generated source sheets are normalized onto the native grid; they are not represented as manually placed pixel art. It uses original artwork, not ripped SNES assets. The archived original Rainbow Flight retains its original artwork.

## Gameplay audit and improvements (October 2026)

Reviewed control feel, readable objectives, collision fairness, recovery, companion behavior and touch/controller access across all seven games. The review draws on [Maddy Thorson’s Celeste forgiveness techniques](https://www.maddymakesgames.com/articles/celeste_and_forgiveness/index.html) and the [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/). These informed jump forgiveness, contextual guidance, larger readable UI and difficulty changes during play; this is not a claim of full accessibility compliance.

| Game              | Finding                                                          | Implemented improvement                                                                                                             |
| ----------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Cloudberry Climb  | Fixed-height jumps, abrupt camera, attached dog                  | Variable jump height, wall-jump grace, smoother camera, collectible guidance and independent Bean bounds between reached platforms  |
| Banana Meadows    | Unclear checkpoints and finish condition                         | Visible checkpoints, recovery messages, short hops, grounded finish and roaming companion                                           |
| The Lantern Woods | Unclear return objective; wand hits through gate                 | Quest arrows, shrine return guidance, wall-blocked wand and Bean following traversed paths with safe excursions                     |
| Rainbow Rally     | Obstacles drift away from their lanes; frame-dependent slowdown  | Road-relative obstacles, consistent drag, countdown, progress feedback; Bean drives a separate little kart                          |
| Starlight Bounce  | Center hits can repeat vertically; ambiguous brick rebounds      | Minimum lateral bounce, collision separation, launch guide; Bean explores beside the player below the paddle                        |
| Pocket Garden     | One press discards progress; trapped pots unclear                | Hold-to-reset, undo guidance and trapped-pot warnings; Bean roams without pushing or blocking pots                                  |
| Unicorns in Orbit | Diagonal speed advantage, misleading shield, similar projectiles | Normalized movement, active-only shield, distinct hostile shots, firing warnings, wave breaks; Bean follows on his own flying mount |

Bean has independent position, speed, facing and animation. He periodically explores ahead then returns, including while the player rests. On platforms he waits for a safe landing before bounding after the player; in the woods he follows the traveled route around walls. Selecting Bean as the playable character hides the companion copy. His companion role never takes damage or changes scoring.

Shared improvements include contextual hints, larger small-screen text, Gentle mode in the pause menu, controller navigation of pause actions, jump-release input, and cancellation of queued audio on pause/restart. Automated checks cover mechanics, complete puzzle/platform/shooter routes, companion following/exploration, timing, browser rendering, keyboard, simulated controller and simultaneous touch input. Physical-controller feel, audio-device latency and a family playtest remain manual checks; these are small authored games, not commercial-scale campaigns.

## Seven art directions

The original scene kit repeated the same mountain, tree and star shapes across unrelated genres. Each game now has an individual environment, palette, foreground material and decorative vocabulary:

| Game              | Environment                                          | Foreground identity                                               |
| ----------------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| Cloudberry Climb  | Quiet blue alpine peaks and layered cloud banks      | Bright ice edges, dark rock, clear stars and dash crossings       |
| Banana Meadows    | Pale tropical sky, distant islands and lagoon        | Bright grass-topped earth, open landing areas                     |
| The Lantern Woods | Petrol-blue ancient woodland, roots and amber lights | Moss walls, subdued paths, warm lanterns                          |
| Rainbow Rally     | Sea-green coastal horizon and a projected road       | Striped curbs, slate road, roadside trees and rear-view karts     |
| Starlight Bounce  | Navy and brass celestial clockwork observatory       | Jewel-colored bricks, brass rails and gears                       |
| Pocket Garden     | Warm Italian greenhouse                              | Terracotta borders, cream soil squares, succulents                |
| Unicorns in Orbit | Magenta nebula and peach ringed planet               | Cool flight corridor, sparse moving dust, contrasting projectiles |

Research: [SLYNYRD’s side-view tiles](https://www.slynyrd.com/blog/2020/5/21/pixelblog-28-side-view-tiles) informed foreground/background separation, small tile vocabularies, restrained palettes and material variants. His [texture tutorial](https://www.slynyrd.com/blog/2018/2/15/pixelblog-2-texture) informed clustered detail, empty areas and suppression of incidental single-pixel noise. [Saint11’s anti-aliasing and banding article](https://saint11.art/pixel_art_articles/article5/) informed the distinction between intentional pixel clusters and accidental filtering. These are design references, not copied artwork.

The background atlas was created using the **imagegen skill and built-in image generation tool**. Its exact prompt is saved in `public/art/prompt.txt`; the generated original is `public/art/eight-worlds-v1.png`. The preparation pipeline crops the eight panels using their inspected boundaries, converts each to 320×180 native pixels and a maximum of 32 colors, suppresses small isolated artifacts, and reduces background brightness to preserve playability. The game normally loads the prepared native atlas; original sheets provide a local fallback. This is generated artwork processed for the pixel pipeline, not a claim that every background pixel was individually hand placed. Foreground plants, crystals, lanterns and gears come from `public/art/flora-v1.png`; collision surfaces and repeating materials are code-authored in `src/world-art.js`. All consumed assets live in this repository; no remote image service is needed to play.

Platformer backgrounds now have three independently scrolling layers, using a maximum of five colors per layer. They are prepared from `public/art/platform-parallax-v1.png` (exact prompt: `public/art/platform-parallax-prompt.txt`). Palette-preserving majority cleanup removes source stippling. Platforms have a bright continuous top edge and a sparse dark body so landings read at a glance. Banana Bay has broad, short-gap beach islands and optional elevated bananas; thin Meadows ledges allow jumping up through them. Cloudberry Climb has deliberate jump practice, two dash gaps, recovery terrain and three checkpoints.

Rainbow Rally uses a 320×180 scanline-projected ground plane, depth-sorted obstacles and rear-view family karts. All perspective size variants are rasterized before drawing at 1:1, keeping a single pixel grid. [Kulor’s Mode 7 perspective guide](https://forums.nesdev.org/viewtopic.php?t=24053) informed the per-scanline perspective approach; this is an original browser implementation, not an SNES emulator.

The shelf uses the same environments and role-specific poses as the playable games: climbing, running, casting, driving, carrying a paddle, pushing a pot, riding and celebrating. The family cast remains shared so Gaia, Bean, Nur and Arnaud are recognizable across genres. Art does not drive collision geometry. Authored platform routes and puzzle rules remain independently tested as animation and controls evolve. The browser suite checks that artwork actually loaded; the pixel suite checks all eight distinct palettes, opaque background pixels, native texture mapping and integer enlargement at three screen densities.

## Character animation and native assets

Open `/sprite-lab.html` to play every animation, reverse facing, vary playback speed and inspect individual frames. The studio also displays each family kart, animated creature and foreground object.

The photo-matching pass updates all nine family source sheets, including front/back poses, riding, pushing, carrying, wall clinging and kart drivers. The asset-failure check verifies all seven games remain playable both when the native atlas is unavailable (local source sheets load) and when all artwork requests fail (code-authored fallback art).

Each family member has **37 distinct poses**: idle expressions, four-step locomotion, jumping/falling/dashing/landing, wand actions, celebration, front/back walking, seated riding, garden pushing, overhead paddle carrying, directional wand actions and wall clinging. Named clips use explicit durations; motion comes from actual game state instead of merely checking which button is held. Feet and rider seat anchors keep characters connected to surfaces and mounts. Human platform collision clearance follows the taller sprites while Bean keeps his lower body height; the rendered foot position stays fixed. Pausing freezes animations; winning freezes the simulation while the family celebrates.

Bean’s sheet preserves his slender greyhound silhouette. His independent controller alternates following, safe excursions and returns, with galloping, sniffing, looking around, sitting and play-bow poses. Garden routes avoid hedges and flower pots. He has his own kart and flying mount, and the companion copy disappears when Bean is selected as the player.

All source artwork was created with the **imagegen skill and built-in image generation tool**, then processed for the game’s one-pixel grid. No CLI image-generation fallback was used. The exact prompts are retained alongside the source assets:

| Source artwork                            | Exact prompt                                        |
| ----------------------------------------- | --------------------------------------------------- |
| `public/art/characters/gaia-v2.png`       | `public/art/characters/gaia-photo-prompt.txt`       |
| `public/art/characters/bean-v2.png`       | `public/art/characters/bean-photo-prompt.txt`       |
| `public/art/characters/nur-v2.png`        | `public/art/characters/nur-photo-prompt.txt`        |
| `public/art/characters/arnaud-v2.png`     | `public/art/characters/arnaud-photo-prompt.txt`     |
| `public/art/characters/directions-v2.png` | `public/art/characters/directions-photo-prompt.txt` |
| `public/art/characters/riders-v2.png`     | `public/art/characters/riders-photo-prompt.txt`     |
| `public/art/characters/actions-v2.png`    | `public/art/characters/actions-photo-prompt.txt`    |
| `public/art/characters/skills-v2.png`     | `public/art/characters/skills-photo-prompt.txt`     |
| `public/art/characters/karts-rear-v3.png` | `public/art/characters/karts-rear-v3-prompt.txt`    |
| `public/art/characters/creatures-v1.png`  | `public/art/characters/creatures-prompt.txt`        |
| `public/art/objects-v1.png`               | `public/art/objects-prompt.txt`                     |
| `public/art/flora-v1.png`                 | `public/art/flora-prompt.txt`                       |

The runtime atlas is `public/art/native/arcade-v4.png`, indexed by `manifest.json`: 148 family poses, 16 kart poses, 16 creature frames, 32 objects/props and eight source backgrounds (the retired festival art remains as source history), plus six parallax layers. Normal play requests this single compact atlas and its manifest instead of loading the high-resolution source sheets. Version 4 includes rear-view karts and six parallax layers alongside the photo-informed family designs plus flower springs, leaf ferries, picnic objects and keepsakes; earlier source sheets remain as art history. Sprite transparency is strictly 0 or 255; family palettes use at most 28 colors (Bean 16), creatures and props at most 32. Native size variants are cached and rendered with nearest-neighbor 1:1 texels. This guarantees a consistent pixel grid, not a claim that an image generator perfectly authored every original pixel.

With the dev server running, rebuild this atlas after changing source images or normalization:

```sh
npm run prepare:art
npm run test:animation
npm run build
```

Animation research: [Aseprite’s animation documentation](https://www.aseprite.org/docs/animation/), [tags](https://www.aseprite.org/docs/tags/) and [sprite-sheet organization](https://www.aseprite.org/docs/sprite-sheet/) informed explicit frame sequences and timing, named clips and reusable sheets. The source art is generated; Aseprite itself is not a runtime dependency. Animation poses and silhouettes were inspected in the studio and in the actual games.

The animation browser check verifies all 148 family poses are distinct, every sprite has binary transparency and a bounded palette, and normal play requests only the prepared atlas. Other checks exercise actual game animation transitions, eight-way touch dragging (including starting on an empty diagonal pad corner), simultaneous actions, switching simulated controllers, puzzle completion and animated victory, pause/dialog focus, immediate muting and quiet music output. The journey suite completes the woodland quest and garden puzzle through browser keyboard controls. The platform suite completes both platformers in Classic mode without retries; the arcade journey drives the racer, aims the paddle and flies/fires through the shooter waves. These drivers send keyboard events and only read diagnostics; they do not set scores or teleport the live player. The render soak visits all four heroes in all seven games three times and verifies that texture and mesh caches stabilize. HUD panels sit outside the game image, and short portrait screens scroll the controls into view when play begins. Chromium, WebKit and Firefox rendering and animation checks passed. Real controller ergonomics and speaker/headphone listening remain manual checks.

The expansion source sheet is `public/art/expansion-v1.png`; its exact generation prompt is `public/art/expansion-prompt.txt`. It was created with the built-in image-generation tool, then processed through the same native palette and binary-alpha pipeline. The runtime atlas now contains 226 frames.
