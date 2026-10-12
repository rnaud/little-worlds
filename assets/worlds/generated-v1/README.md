# Generated world sources

Created with the built-in image_gen tool. `prompts.json` records the nine original prompts; `meadow-sky-prompt.txt` records the final separately generated opaque coastal sky. The sky replaces only the first panel of meadow.png during preparation. The discarded sky repair is not included.

Summit and Meadow sheets contain three equal stacked panels: sky, distant scenery and near scenery. The other images are individual scenes. Originals are retained unchanged. Run `npm run prepare:worlds` from the repository root to create the native-resolution public atlas, using nearest sampling, hard transparency, atmospheric contrast preparation and a shared 32-color palette per world. Runtime never downloads these full-resolution source files.

## Generated world backgrounds

All nine environments were created with the built-in image-generation tool. Original PNGs and generation prompts live in `assets/worlds/generated-v1/`, outside the website build. The runtime atlas and manifest are in `public/art/generated-worlds/`. The prepared backgrounds are 320×180 with at most 32 colors per world, nearest-neighbor sampling, hard alpha and no smoothing or dithering. These are generated pixel-art designs prepared for the game's resolution, not manually authored one-pixel source drawings.

Cloudberry Climb has an aurora-lit alpine observatory; Banana Meadows has a sunlit Mediterranean harbor; Lantern Woods has an amber treehouse sanctuary; Rally has a Riviera panorama; Starlight Bounce has a brass celestial workshop; Pocket Garden has a working conservatory; Orbit has a peach-ring nebula; Bubble Rescue has a moonlit copper soapworks; Splash Garden has a terracotta courtyard.

The two platformers use three separately extracted sky, distant and near planes at different camera speeds. Near scenery is lowered and its contrast softened to protect gameplay readability. Each world's three planes share a palette, so compositing remains within 32 colors. Rally crops and scrolls native panorama rows behind the unchanged Mode 7 track. Rich edge scenery surrounds quieter play areas in the overhead and arcade games.

Birds, fireflies and rising soap bubbles continue using the simulation clock, freezing on pause. Static generated structures replace the earlier code-drawn ornaments; the older environments remain available if downloads fail. No background object changes collisions or scoring.

Rebuild prepared artwork and its inspection export with:

```sh
npm run prepare:worlds
npm run prepare:art
npm run test:pixels
npm run test:assets
npm run test:render
```

Pixel tests require the generated atlas, check opaque skies and transparent parallax silhouettes, enforce distinct layer speeds, and verify all nine palettes and 1:1 texture mapping. Rendering tests inspect all four family heroes in all nine games with stable texture caches. Fallback tests block family artwork, world artwork and all artwork independently.
