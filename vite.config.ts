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
      // Auto-update the cached app shell on each deploy (skipWaiting +
      // clientsClaim under the hood) so users never get stuck on a stale build.
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
      workbox: {
        // Precache the whole app shell so the home-screen app boots offline.
        globPatterns: ["**/*.{js,css,html,svg,woff2,wasm}"],
        cleanupOutdatedCaches: true,
        // Single-page app: any offline navigation falls back to the shell.
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            // The EmulatorJS engine + cores are pulled from the CDN at runtime.
            // Cache them on first use (CacheFirst) so each system keeps working
            // offline once it has been played online at least once. ROMs and
            // save states already live in IndexedDB, so they're offline too.
            urlPattern: /^https:\/\/cdn\.emulatorjs\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "emulatorjs-cdn",
              cacheableResponse: { statuses: [0, 200] },
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
