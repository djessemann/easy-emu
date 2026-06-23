import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Relative base so the built app works both on the web and when bundled
// into a native iOS WebView (Capacitor serves from the filesystem).
export default defineConfig({
  base: "./",
  build: {
    // Stable, un-hashed asset filenames. With content-hashed names a stale
    // cached index.html (GitHub Pages caches HTML briefly) can point at a
    // renamed bundle the new deploy deleted → 404 → white screen. Fixed names
    // mean a slightly-stale shell still resolves to a file that exists.
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
      // No offline service worker. A precaching worker on iOS + GitHub Pages
      // was the repeated cause of blank/white screens (iOS rarely updates or
      // clears a stuck worker), so we ship a self-destroying worker: it
      // unregisters any worker still installed on a device and clears its
      // caches, leaving a plain web app that always loads the latest deploy.
      // The emulator engine + cores are self-hosted (public/ejs-data) and so
      // load fast from our own origin and HTTP-cache normally. (For true
      // offline play, wrap the build with Capacitor — the right place for it.)
      selfDestroying: true,
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
    }),
  ],
});
