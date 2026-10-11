// Static imports let Vite resolve one shared module graph, even after HMR edits.
// Importing source modules individually by URL can otherwise load a second copy
// of an art cache with a different timestamp from the renderer's dependency.
import * as engine from "../src/engine.js";
import * as games from "../src/games.js";
import * as worlds from "../src/world-art.js";
import * as characters from "../src/characters.js";
import * as creatures from "../src/creatures.js";
import * as objects from "../src/objects.js";
export { engine, games, worlds, characters, creatures, objects };
export async function loadArt() {
  await Promise.all([
    worlds.loadWorldArt(),
    characters.loadCharacterArt(),
    creatures.loadCreatureArt(),
    objects.loadObjectArt(),
  ]);
  for (const status of [
    worlds.artStatus,
    characters.characterArtStatus,
    creatures.creatureArtStatus,
    objects.objectArtStatus,
  ])
    if (!status.loaded)
      throw new Error(status.error || "Artwork failed to load");
}
