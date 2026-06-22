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

// Serve navigations NETWORK-FIRST. This is the fix for the "white screen after
// every update": a precache (cache-first) shell can serve an old index.html
// that points at JS bundles the new deploy already renamed, giving a blank
// page. Network-first means that whenever we're online we always load the
// freshly deployed shell; we fall back to the cached shell only when offline.
// Registered before the precache route so it wins for navigation requests.
registerRoute(
  new NavigationRoute(
    new NetworkFirst({ cacheName: "shell", networkTimeoutSeconds: 3 }),
  ),
);

// Everything else — the app's hashed assets and the self-hosted EmulatorJS
// engine + cores under /ejs-data — is precached and served from cache.
precacheAndRoute(self.__WB_MANIFEST);

// The EmulatorJS CDN is only a fallback now (cores are self-hosted and tried
// locally first). Cache whatever it does serve so it still works offline after
// the first fetch; only real 200s are cached, never opaque/partial responses.
registerRoute(
  ({ url }) => url.origin === "https://cdn.emulatorjs.org",
  new StaleWhileRevalidate({
    cacheName: "emulatorjs-cdn-v3",
    plugins: [new CacheableResponsePlugin({ statuses: [200] })],
  }),
);
