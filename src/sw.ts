/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: unknown[] };

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

// Precache ONLY the self-hosted EmulatorJS engine + cores (see
// vite.config injectManifest.globPatterns), so games play offline from the
// first launch. The app shell is deliberately NOT precached — it's handled by
// the runtime routes below, which never go stale-broken.
precacheAndRoute(self.__WB_MANIFEST);

// The app shell (index.html) is served NETWORK-FIRST and with the HTTP cache
// bypassed (`cache: "reload"`), so an online visit ALWAYS loads the freshly
// deployed shell — never a stale one pointing at renamed bundles (the cause of
// the white screen on update). Offline, it falls back to the last cached shell.
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: "shell",
      networkTimeoutSeconds: 3,
      fetchOptions: { cache: "reload" },
    }),
  ),
);

// The app's own static assets (JS/CSS/icons). Stale-while-revalidate: served
// instantly from cache (so it works offline) while refreshing in the
// background. A cache miss just fetches from the network and stores it.
registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin && request.destination !== "document",
  new StaleWhileRevalidate({ cacheName: "assets" }),
);

// The EmulatorJS CDN is only a fallback (cores are self-hosted and tried
// locally first). Cache whatever it serves so it works offline afterwards.
registerRoute(
  ({ url }) => url.origin === "https://cdn.emulatorjs.org",
  new StaleWhileRevalidate({
    cacheName: "emulatorjs-cdn-v3",
    plugins: [new CacheableResponsePlugin({ statuses: [200] })],
  }),
);
