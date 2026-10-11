import { defineConfig } from "vite";
export default defineConfig({
  base: process.env.PAGES_BASE || "/",
  build: {
    outDir: "build",
    rollupOptions: {
      input: { main: "index.html", sprites: "sprite-lab.html" },
      output: { manualChunks: { three: ["three"] } },
    },
  },
});
