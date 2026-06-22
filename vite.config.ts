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
      // "prompt" registration keeps the service worker PASSIVE: a newly
      // deployed worker installs in the background and only takes over once
      // every tab is closed (no skipWaiting / clientsClaim). This is
      // deliberate — an auto-updating worker can claim and reload a live page
      // mid-session, which looked like the game "reloading back to the menu".
      registerType: "prompt",
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
      workbox: {
        // Precache the whole app shell so the home-screen app boots offline.
        globPatterns: ["**/*.{js,css,html,svg,woff2,wasm}"],
        cleanupOutdatedCaches: true,
        // Single-page app: any offline navigation falls back to the shell.
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            // The EmulatorJS engine + cores are pulled from the CDN at runtime.
            // StaleWhileRevalidate serves the cached copy instantly (so each
            // system keeps working offline once played online) while quietly
            // refreshing it in the background — so a flaky or partial download
            // self-heals on the next load instead of sticking forever. Only
            // real 200s are cached (never opaque/partial responses), which is
            // what was previously corrupting cores. ROMs and save states live
            // in IndexedDB, so they're offline regardless.
            urlPattern: /^https:\/\/cdn\.emulatorjs\.org\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "emulatorjs-cdn-v2",
              cacheableResponse: { statuses: [200] },
              rangeRequests: true,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
              },
            },
          },
        ],
      },
    }),
  ],
});
