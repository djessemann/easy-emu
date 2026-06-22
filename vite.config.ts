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
      registerType: "autoUpdate",
      // Temporarily ship a self-destroying service worker: any SW previously
      // installed on a device unregisters itself and clears its caches. This
      // recovers users stuck on a stale cache after a redeploy (which can show
      // a blank page). Re-enable a real offline SW later once stable.
      selfDestroying: true,
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
        // Cache the app shell. The emulator cores are loaded from a remote
        // CDN at runtime and are intentionally NOT precached here — for true
        // offline play (the iOS build), self-host the EmulatorJS data folder.
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
      },
    }),
  ],
});
