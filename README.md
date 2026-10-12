# Little Worlds — the family arcade

Nine original, bite-sized 2D games built with Three.js for family play on desktop, phone or controller.

**▶ [Play in your browser](https://rnaud.github.io/little-worlds/)**

## Games

Cloudberry Climb · Banana Meadows · The Lantern Woods · Rainbow Rally · Starlight Bounce · Pocket Garden · Unicorns in Orbit · Bubble Rescue · Splash Garden

The original Rainbow Flight game is preserved at `/rainbow-flight/`.

## Controls

- **Keyboard:** arrows or WASD to move, Space/Z/Enter for A, X/Shift for B, Escape/P to pause, R to restart.
- **Touch:** on-screen direction pad and two action buttons.
- **Controller:** stick or D-pad, south button A, east/west button B, Start to pause.

Gentle mode (on by default) makes every game more forgiving. Progress saves to the browser's localStorage, with no account, analytics or backend.

## Develop

Requires Node 20.19+ or 22.12+.

```sh
npm install
npm run dev
npm test
npm run build
```

Pushes to `main` are tested and deployed to GitHub Pages by `.github/workflows/pages.yml`.
