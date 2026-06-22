import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Relative base so the built app works both on the web and when bundled
// into a native iOS WebView (Capacitor serves from the filesystem).
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      // Custom service worker (src/sw.ts) so we can serve the app shell
      // network-first — see that file for why. The self-hosted EmulatorJS
      // engine + cores (public/ejs-data, built by scripts/vendor-emulatorjs.mjs)
      // are precached alongside the shell, so the app plays fully offline.
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
        // Precache the app shell + the self-hosted engine/cores. Core wasm
        // bundles are ~1-1.3 MB each, so lift the per-file cap above the 2 MB
        // default.
        globPatterns: ["**/*.{js,css,html,svg,woff2,json,data,wasm}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
});
