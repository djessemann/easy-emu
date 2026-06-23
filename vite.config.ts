import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Relative base so the built app works both on the web and when bundled
// into a native iOS WebView (Capacitor serves from the filesystem).
export default defineConfig({
  base: "./",
  build: {
    // Stable, un-hashed asset filenames. With content-hashed names, a stale
    // cached index.html (GitHub Pages caches HTML for ~10 min) points at a
    // renamed bundle the new deploy deleted → 404 → white screen. Fixed names
    // mean a slightly-stale shell still resolves to a file that exists, so the
    // white-screen-on-update failure mode can't happen.
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      // Custom service worker (src/sw.ts) so we can serve the app shell
      // network-first — see that file for why. The self-hosted EmulatorJS
      // engine + cores (public/ejs-data, built by scripts/vendor-emulatorjs.mjs)
      // are precached so the app plays fully offline.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icon.svg"],
      manifest: {
        name: "easy-emu",
        short_name: "easy-emu",
        description:
          "A dead-simple mobile emulator for NES, SNES, Genesis and Game Boy.",
        theme_color: "#0f1115",
        background_color: "#0f1115",
        display: "standalone",
        orientation: "any",
        start_url: "./",
        scope: "./",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      injectManifest: {
        // Precache only the self-hosted engine + cores (stable filenames). The
        // app shell is intentionally excluded and handled network-first at
        // runtime, so it can never serve a stale shell pointing at missing JS.
        globDirectory: "dist",
        globPatterns: ["ejs-data/**/*.{js,css,json,data,wasm}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
});
