# Little Worlds — the family arcade

Nine original, bite-sized 2D games, rendered with Three.js and an orthographic camera. Built for Gaia and family play, with the unicorn, woodland, and banana motifs from the existing Rainbow Flight project. The family party includes Gaia (5, blonde), Bean (a light-brown Italian greyhound), Nur (Italian, dark bob), and Arnaud (French, 39). Choose a character through Players on the shelf; the choice persists on the device. The image-generated family sprites use the supplied family photos only as design references: Gaia’s loose sandy-blonde hair, red headband and blue dress; Nur’s dark bob and striped blouse; Arnaud’s wavy hair, beard and navy shirt; Bean’s fawn coat, white chest, muzzle and paws, and black collar. The original photographs are not copied into the game or its public assets. The original game is preserved at `/rainbow-flight/`.

## Run

Requires Node 20.19+ or 22.12+.

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

Vite prints the local and LAN URLs. Open the LAN URL from a phone on the same network for touch play. Browser checks run in background test contexts with native OS fullscreen declined, so they exercise the full-viewport layout without taking over the developer’s screen. Games fill the browser viewport without entering native fullscreen or hiding browser controls. Serve the `build/` output with any static HTTP host. The production build bundles Three.js locally; graphics use bundled local assets and code, and fonts use system resources; no external asset requests are needed.

## Games

| Game              | Genre                       | Finish condition                                                                                |
| ----------------- | --------------------------- | ----------------------------------------------------------------------------------------------- |
| Cloudberry Climb  | Precision platformer        | Three mountain journeys: jumps, dash crossings and crumbling ice; collect three stars per stage |
| Banana Meadows    | Classic platformer          | Six stages: collect bananas, ride ferries, bounce on flower springs and reach the cottage       |
| The Lantern Woods | Top-down adventure          | Find a key, unlock the gate, recover three lanterns and return to the shrine                    |
| Rainbow Rally     | Mode 7 style racer          | Finish a 1,800 m circuit; steer, boost, brake and avoid puddles                                 |
| Starlight Bounce  | Brick breaker               | Three boards of 24 bricks; paddle, launch, timed catch and slow-motion assist                   |
| Pocket Garden     | Push-block puzzle           | Eight progressively harder gardens, from one pot to four; unlimited undo and reset              |
| Unicorns in Orbit | Space shooter               | Clear three waves and the Moon Keeper; move, fire and reflect shots with a rechargeable shield  |
| Bubble Rescue     | Cooperative platform arcade | Rescue 18 woodland sprites across three bathhouses; jump, trap, pop and chain rescues           |
| Splash Garden     | Water-balloon maze          | Clear hedges, water ten flowers across three courtyards, and reach each gate                    |

These are small complete games with authored levels, not full commercial-scale campaigns. The design references are **Celeste** for Cloudberry Climb’s dash and forgiving jump timing; **Super Mario World** for Banana Meadows’ running, springs and alternate paths; **A Link to the Past** for The Lantern Woods’ key, gate and return journey; **Super Mario Kart** for Rainbow Rally’s projected circuit; **Arkanoid** for Starlight Bounce; **Sokoban** for Pocket Garden; and **Gradius/Galaga** for Unicorns in Orbit’s wave patterns. Names, artwork, characters and music are original. Banana Meadows and Bubble Rescue support a second family helper, with shared collectibles and free recovery; the other games are single player, designed for taking turns on the same device.

The strongest replay hooks are the platform stages, garden puzzles, woodland discoveries and race times. The brick breaker and space game remain shorter arcade diversions. Automated completion checks establish that the routes are playable; they cannot establish whether Gaia finds them fun. A useful family playtest is to watch whether she understands the first objective without explanation, asks for another try after a miss, and can name a favorite moment. Prioritize changing unclear or dull moments before adding more cartridges. **Bubble Rescue** now adds cooperative Bubble Bobble-inspired rescue play, while **Splash Garden** adds Bomberman-inspired water-balloon planning. Both have three authored rooms and support Gentle and Classic play. The rhythm cartridge remains removed.

## New journeys and family play

Cloudberry Climb has three authored routes: First Ascent, Glacier Steps and The Cloud Relay. Broad early landings teach jumping, long crossings require an airborne dash, and the later routes introduce cracked ice. Stable beacons save checkpoints before difficult sections. Collectibles survive retries.

Banana Meadows has six separate stages: Banana Bay, The Palm Walk, Spring Picnic, Lagoon Ferries, Butterfly Steps and The Family Picnic. Each introduces or combines routes, springs, moving leaf platforms and crumbling coral. Checkpoints and unlimited retries remain available. All six have been completed in both difficulties using normal movement controls without retries in deterministic checks.

Pocket Garden has eight authored puzzles. The first takes two moves; later gardens introduce pairs, hedges, corners and four-pot planning. Every puzzle has a verified legal solution. Stages are open from the start, with a Next stage flow and per-stage progress saved locally.

In The Lantern Woods, approach pawprints and press A to ask Bean to investigate. Bean independently travels to and sniffs out Gaia’s ribbon, Nur’s seeds and Arnaud’s compass. Playing as Bean lets you discover them yourself. Two discoveries after opening the gate reveal a physical woodland shortcut; all three appear in the keepsake album. They are optional and do not replace the main lantern quest.

For Meadows or Bubble Rescue co-op, enable **Play together** in the cartridge setup. Choose a human family helper. Controller 1 drives the lead and controller 2 drives the helper; both share progress (bananas or rescued sprites). Alternatively, enable **Touch + one controller**: Gaia uses touch and a parent uses the controller. Keyboard lead: arrows/Space/Shift; helper: WASD/F/G, Q to return. Controller Y returns the helper. Falling or being left behind recalls the helper without costing the lead a retry. Bean follows the lead with his own movement.

Disconnecting an assigned controller pauses play. Controller roles remain fixed across pause, resume and reconnection, so the parent's controller cannot silently take over the lead character. The remaining controller can still navigate the pause menu.

The public deployment checks exercise both co-op cartridges, including disconnection and reconnection, and complete all three Bubble Rescue and Splash Garden rooms in Classic against the production build before publishing.

## GitHub Pages

The deployment workflow in `.github/workflows/pages.yml` tests and builds every push or pull request to `main`, then publishes successful main-branch builds with GitHub Pages. Repository settings must use **GitHub Actions** as the Pages source. It follows the [GitHub Pages custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

The build reads `PAGES_BASE` so artwork, scripts and the sprite studio resolve correctly under a repository URL. To verify locally:

```sh
PAGES_BASE=/little-worlds/ npm run build
PAGES_BASE=/little-worlds/ npm run preview
```

Open the printed `/little-worlds/` URL. Original family photographs are not included. The source repo contains native pixel artwork and first-name family characters.

## Controls and access

- Keyboard: arrows or WASD, Space/Z/Enter for A, X/Shift for B. Escape/P pauses, R restarts.
- Touch: a sliding eight-way direction pad with a neutral center and two action buttons. Keep one thumb down to change direction; a second touch can jump, cast, boost or fire. Canceled touches are released immediately.
- Standard-mapped controller: stick or D-pad, south button A, east/west button B, Start pauses, Select restarts. Navigate the spatial cartridge shelf and every menu with directions and A. Hold a direction to repeat. B closes dialogs or returns to the shelf; focus returns to the selected cartridge. Players, difficulty, sound, album, stage selection, co-op setup, pause, restart, victory and replay are accessible with a controller. The optional name editor includes an on-screen letter keyboard. Browser Gamepad API availability varies; press a controller button to wake it.
- Gentle mode: available on the shelf, on by default. More forgiving jumps, harmless adventure/shooter hits, unlimited brick-breaker balls, slower threats. Platformers always offer unlimited retries and checkpoints.
- Sound is on by default and begins on play after browser interaction. Every game has its own original chip melody. Twenty-one distinct cues cover jumps, dashes, pickups, checkpoints, springs, planting, undoing, wand swings, shield activation, shots, bumps and celebrations; the racer adds a speed-sensitive motor. Mute from the header or pause menu; the preference is saved. Muting or pausing stops scheduled audio immediately.
- Completed stages, best stage times, garden move counts, collected keepsakes, character, co-op settings, name, and gentle mode save to this browser’s localStorage. No account, analytics, or backend. Storage failures fall back to session-only play.
- Keyboard focus styles, semantic buttons, reduced-motion UI support, automatic pause on blur, portrait letterboxing, and landscape touch controls. Gameplay itself requires visual interaction and WebGL.

## Structure

- `src/catalog.js`: game titles, instructions and shelf metadata.
- `src/characters.js`, `src/animation.js`: generated family atlas, named animation clips and gameplay-driven pose selection.
- `src/creatures.js`, `src/objects.js`, `src/world-art.js`: animated creatures, interactive objects, foreground props and nine environments. Native drawings live in `native-actors.js`, `native-creatures.js`, `native-objects.js` and `native-scenes.js`.
- `src/sprite-pipeline.js`: unfiltered canvas creation for Mode 7 distance projections.
- `src/art.js` and `src/pixels.js`: shelf covers and code-authored fallback art.
- `src/companions.js`, `src/navigation.js`: Bean’s independent movement and safe garden routing.
- `src/music.js`: original quiet chip themes.
- `sprite-lab.html`: live animation and native-frame inspection studio.
- `src/engine.js`: pooled Three.js drawing primitives, unified input and synthesized audio.
- `src/games.js` and `src/party-games.js`: nine game implementations, with shared behavior in `src/world.js`.
- `src/main.js`: shelf, lifecycle, pause/retry/win overlays, profile and persistence.
- `tests/arcade.test.js`: deterministic mechanics, level reachability and win/loss checks.
- `public/rainbow-flight/`: preserved original game.

For a new world, add a catalog entry and a world class with `update(dt, input)` and `draw(painter)`, then register it in `createGame`. Player names can be changed using the avatar; edit the catalog for additional family themes. The art preparation command below rebuilds the native atlas after native artwork changes. It is an inspection/export asset, not a runtime dependency.

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
npm run test:summit
npm run test:coop
npm run test:discoveries
npm run test:party
npm run test:bricks
# Optional, with Playwright WebKit and Firefox installed:
npm run test:cross-browser
```

The browser suite opens all nine games and checks pause/resume, filtering, profile and progress persistence, keyboard input, simulated standard gamepad Start behavior, and simultaneous touch movement/jumping. It saves desktop, portrait, and landscape screenshots in `tests/artifacts/`. The pixel-grid suite verifies 1:1 texture pixels and integer geometry in all nine games, plus integer display alignment at device pixel ratios 1, 1.25 and 2 in desktop, portrait and landscape, including a 320-pixel-wide viewport. It also checks the actual image fit, integer enlargement and physical-pixel alignment of shelf covers and family portraits. Set `ARCADE_URL` for another server or `BROWSER_EXECUTABLE` to use an existing Chromium installation. The cross-browser suite accepts `BROWSER_ENGINES=webkit` or `firefox` and an optional matching executable path. Source-module inspection suites require the dev server; `test:browser` also runs against the production preview. Simulated input checks do not replace testing a physical controller on your target device.

`npm run format` formats the authored source. Production output goes to `build/`; the previously tracked `dist/` files remain the untouched original Rainbow Flight.

## Pixel-art rendering

The Three.js framebuffer is exactly 320×180 on every device. One art pixel maps to one framebuffer pixel. Family actors use prepared generated frames and nearest-neighbor compact variants. Variable-size props are drawn directly at their target integer dimensions; at runtime every texture texel maps 1:1 onto that grid. All edges snap to integer pixels, including odd-width sprites. Curves use binary pixel masks, lines use Bresenham steps, and transparency uses binary screen-aligned dithering. There are no rotated meshes, filtered edges, or fractional texture scaling. The canvas enlarges only by whole physical-device-pixel multiples and letterboxes unused space; it never stretches to fill the stage. Shelf artwork follows integer enlargement too. DOM text and controls remain normal accessible browser UI, outside the game artwork grid. The runtime art uses integer pixel coordinates and limited 16-bit-inspired palettes. Family animation has 37 distinct poses per character, with named clips and nonuniform frame timing. Family characters and karts use restored generated sheets; creatures remain code-drawn in `src/native-creatures.js`. Actor variants are rasterized to integer canvases before being drawn on the framebuffer; Mode 7 projects karts into distance-dependent sizes. It uses original artwork, not ripped SNES assets. The archived original Rainbow Flight retains its original artwork.

## Gameplay audit and improvements (October 2026)

Reviewed control feel, readable objectives, collision fairness, recovery, companion behavior and touch/controller access across all nine games. The review draws on [Maddy Thorson’s Celeste forgiveness techniques](https://www.maddymakesgames.com/articles/celeste_and_forgiveness/index.html) and the [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/). These informed jump forgiveness, contextual guidance, larger readable UI and difficulty changes during play; this is not a claim of full accessibility compliance.

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

## Nine art directions

The original scene kit repeated the same mountain, tree and star shapes across unrelated genres. Each game now has an individual environment, palette, foreground material and decorative vocabulary:

| Game              | Environment                                          | Foreground identity                                                  |
| ----------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| Cloudberry Climb  | Quiet blue alpine peaks and layered cloud banks      | Bright ice edges, dark rock, clear stars and dash crossings          |
| Banana Meadows    | Pale tropical sky, distant islands and lagoon        | Bright grass-topped earth, open landing areas                        |
| The Lantern Woods | Petrol-blue ancient woodland, roots and amber lights | Moss walls, subdued paths, warm lanterns                             |
| Rainbow Rally     | Sea-green coastal horizon and a projected road       | Striped curbs, slate road, roadside trees and rear-view karts        |
| Starlight Bounce  | Navy and brass celestial clockwork observatory       | Jewel-colored bricks, brass rails and gears                          |
| Pocket Garden     | Warm Italian greenhouse                              | Terracotta borders, cream soil squares, succulents                   |
| Unicorns in Orbit | Indigo nebula and peach ringed planet                | Cool flight corridor, sparse moving dust, contrasting projectiles    |
| Bubble Rescue     | Moonlit bathhouse                                    | Cyan tile lips, tall windows and bright soap bubbles                 |
| Splash Garden     | Walled courtyard                                     | Cream paths, dark stone, removable green hedges and colorful flowers |

Research: [SLYNYRD’s side-view tiles](https://www.slynyrd.com/blog/2020/5/21/pixelblog-28-side-view-tiles) informed foreground/background separation, small tile vocabularies, restrained palettes and material variants. His [texture tutorial](https://www.slynyrd.com/blog/2018/2/15/pixelblog-2-texture) informed clustered detail, empty areas and suppression of incidental single-pixel noise. [Saint11’s anti-aliasing and banding article](https://saint11.art/pixel_art_articles/article5/) informed the distinction between intentional pixel clusters and accidental filtering. These are design references, not copied artwork.

All active environments and props are now authored on the native pixel grid in `src/native-scenes.js`, `src/native-objects.js`, `src/party-art.js` and `src/rally-art.js`. The family and kart sprites use a compact generated atlas; environments and props remain code-drawn. Simple, deliberate clusters and subdued play areas keep characters, threats and objectives legible.

Platformer backgrounds have three independently scrolling native layers, using a maximum of five colors per layer. Platforms have a bright continuous top edge and a sparse dark body so landings read at a glance. Banana Bay has broad, short-gap beach islands and optional elevated bananas; thin Meadows ledges allow jumping up through them or dropping with Down + A. Cloudberry Climb has deliberate jump practice, two dash gaps, recovery terrain and three checkpoints.

Rainbow Rally samples a 512×512 island circuit into a 320×180 ground plane using nearest-neighbor inverse perspective. The camera follows the oval track, with a checkered start/finish line, depth-sorted roadside trees and obstacles, and rear-view family karts. Two family pacers provide someone to overtake, with finishing position shown alongside the lap time; Bean stays an independent companion. An exhausted boost recharges until A is released; braking does not spend boost fuel. The shared projection keeps pickups and puddles on the same collision plane as the driver. All perspective size variants are rasterized before drawing at 1:1, keeping a single pixel grid. [Kulor’s Mode 7 perspective guide](https://forums.nesdev.org/viewtopic.php?t=24053) informed the per-scanline perspective approach; this is an original browser implementation, not an SNES emulator.

The shelf uses the same environments and role-specific poses as the playable games: climbing, running, casting, driving, carrying a paddle, pushing a pot, riding and celebrating. The family cast remains shared so Gaia, Bean, Nur and Arnaud are recognizable across genres. Art does not drive collision geometry. Authored platform routes and puzzle rules remain independently tested as animation and controls evolve. The browser suite checks that artwork actually loaded; the pixel suite checks all nine distinct palettes, opaque background pixels, native texture mapping and integer enlargement at three screen densities.

Rainbow Rally also has a native-pixel circuit map: the gold marker is the player, pink and cyan markers are the family racers, and a checkered line marks the finish. Marker positions follow the same circuit coordinates as the projected road. The map uses integer pixel runs rather than a resized track image.

## Native character artwork (October 2026 redraw)

The family uses the restored **image-generated designs** from release `3b27527`. Gaia, Bean, Nur and Arnaud each have 37 prepared animation frames and four rear-view kart frames. The runtime source is `public/art/generated-family/atlas-v1.png`, with its companion manifest. Regular actors retain the prepared source pixels; compact variants and kart perspective use nearest-neighbor rasterization. These are generated illustrations prepared for a low-resolution game, not hand-drawn native pixel stencils.

The original generated sheets and the historical preparation atlas are preserved in `assets/characters/generated/` outside the published assets. `tests/restore-generated-family.cjs` extracts only the family and kart groups without changing their pixels. The newer quiet backgrounds, parallax, props, creatures, gameplay and all nine cartridges remain intact. Original family photos are not included.

Bean still follows independently, explores and returns. The water-balloon maze uses a grid route that avoids stone, hedges and balloons. He never blocks the player, pushes puzzle pieces or takes damage. Selecting Bean as the hero hides the companion copy.

Open `/sprite-lab.html` to inspect actual sprites and animation clips. The animation suite verifies all 148 regular family poses, kart/creature poses, palette limits, binary transparency and action transitions. The optional combined inspection atlas is `public/art/native/arcade-v7.png`; runtime loads only the compact generated-family atlas and manifest. A failed family download uses the code-drawn emergency fallback so games remain playable. Rebuild the inspection atlas after changing native artwork:

```sh
npm run prepare:art
npm run test:animation
npm run build
```

## New cartridges and validation

**Bubble Rescue** has three terrace rooms with 4, 6 and 8 woodland sprites. A jumps; B blows bubbles and pops nearby trapped sprites. Quick rescues build a score chain. Trapped sprites eventually escape safely; fruit adds optional points. Gentle mode turns bumps into another rescue opportunity. Classic has three hearts. An optional second family helper uses the established second controller or WASD/F/G controls, shares rescues, and can return safely with Y/Q.

**Splash Garden** has three 13×9 gardens with stone walls, removable hedges and ten flowers in total. A places a water balloon; B pops the oldest early. The splash stops at stone or the first hedge and can chain into another balloon. Marked cells show the upcoming splash. Water all flowers and walk to the gate. Gentle play never ends from splashes; Classic rewards planning a safe escape. Each room replenishes one heart. Bean follows safe cells and occasionally explores.

`npm run test:party` completes both new cartridges in Classic through browser keyboard input. Tests verify safe routes, hedge occlusion, balloon chains, trap expiry, helper input, victory and saved records. `npm run test:pixels` covers all nine games at multiple display densities. Controller tests navigate all nine cartridges, menus and dialogs without a pointer. Source inspection suites use the development server; deployment and controller tests also run against the production preview.

Cartridges use a viewport-filling player without requesting or exiting native browser fullscreen. Start/Escape opens the menu with Resume, Restart, Sound, Gentle mode and Exit to cartridges. Touch has a Menu button. Native pixels enlarge only by integer physical-pixel multiples, with letterboxing where necessary. A viewport regression test covers desktop and both phone orientations and verifies zero native fullscreen API calls.

Automated completion establishes that games can be completed, not whether every family member finds them fun. Physical controller ergonomics and a family playtest remain useful checks.

Starlight Bounce adds a timed catch: press A while the ball is flying to arm the paddle for 1.25 seconds. Catch the next rebound and press A to relaunch; a missed attempt recharges after 2.2 seconds. A luminous paddle rim shows the active window. Consecutive bricks before returning to the paddle form a flight record. Brief checkpoint, room and combo announcements now appear in the reserved fullscreen menu bar without covering the game.

The three Starlight Bounce boards are Star Chart, Twin Telescopes and The Crystal Constellation. All are open from the cartridge setup, have their own records, and use the same Next stage flow as the platformers. Their rows, central passage and diamond formations create different rebound routes. Both difficulties have verified clears through ordinary paddle controls. Bubble Rescue co-op is exercised with `COOP_GAME=bubbles npm run test:coop`.

Unicorns in Orbit now ends with the Moon Keeper, a larger crystal guardian drawn at 48×40 pixels with a separately authored 32×28 version. Its fan shots are signaled before firing, and its remaining starlights appear beneath it. B reflects hostile stars forward while the shield lasts. The second wave also drifts horizontally and uses shallow diagonal shots; the finale replenishes some shield energy. Gentle mode remains forgiving, and Classic completion with shielding is tested.

Splash Garden marks a balloon's splash cells immediately and shows three fuse ticks; it no longer waits until the final second to reveal the affected cells.

Small native-pixel goal counters and charge meters supplement the accessible text HUD: collectible slots, lanterns, flowers, bubbles, hearts, remaining balls, boost, shield and timed catch. Gentle mode omits finite-life hearts. Bean routes away from imminent balloon crosses and active splashes, without affecting the player’s collision or scoring. The brick paddle’s visible top matches its bounce surface and leaves the carrier’s face visible.

Platform route checks cover all four family heroes in both difficulties at 30, 60 and 120 input frames per second (216 complete routes), using the same 120 Hz physics substeps as the browser loop. The driver uses elapsed game time for dash timing instead of counting rendered frames.
