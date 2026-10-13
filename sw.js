/*
 * The offline worker. The build fills in its version and its list of files
 * (vite.config.ts) and writes this out as sw.js. It is plain JavaScript because it
 * runs in the worker, not the game, and it never talks to anything but the site the
 * game came from.
 *
 * Every file goes onto the tablet when the worker installs, and every request is
 * answered from there first, so the game plays with no connection. A new build is a new
 * version: it installs alongside and waits, and the page tells it to take over when the
 * game is next opened (src/offline.ts).
 */
const CACHE = 'spark-works-b2e8645ef176';
const FILES = ["./","assets/andika-latin-400-normal-CDApGPvA.woff","assets/andika-latin-400-normal-CFQEN4Ue.woff2","assets/andika-latin-700-normal-D1aqbIvl.woff","assets/andika-latin-700-normal-DvW8iDJd.woff2","assets/andika-latin-ext-400-normal-Cfx4e8zY.woff","assets/andika-latin-ext-400-normal-DNij61jJ.woff2","assets/andika-latin-ext-700-normal-Bso3_wNk.woff2","assets/andika-latin-ext-700-normal-Cn2-cgMf.woff","assets/baloo-2-latin-700-normal-BEjgkRac.woff","assets/baloo-2-latin-700-normal-DpwkDI0o.woff2","assets/baloo-2-latin-800-normal-BMumZxsR.woff","assets/baloo-2-latin-800-normal-CJQCPmFU.woff2","assets/baloo-2-latin-ext-700-normal-B1EJVTMv.woff2","assets/baloo-2-latin-ext-700-normal-CCvredsU.woff","assets/baloo-2-latin-ext-800-normal-B_oFzHrD.woff","assets/baloo-2-latin-ext-800-normal-BjoUr-js.woff2","assets/editor-CvethpPr.js","assets/index-3vgJEDxC.css","assets/index-BYAZnytD.js","index.html","icons/favicon-32.png","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","manifest.webmanifest"];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
});

self.addEventListener('message', (event) => {
  if (event.data === 'take-over') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('spark-works-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  // Opening the game, with or without ?fps, is always the one page. Vary is ignored:
  // these files never change under one version, and a host that answers "Vary: Origin"
  // would otherwise make every script and stylesheet tag miss and go to the network.
  const navigate = request.mode === 'navigate';
  event.respondWith(
    caches
      .open(CACHE)
      .then((cache) => cache.match(navigate ? './' : request, { ignoreSearch: navigate, ignoreVary: true }))
      .then((hit) => hit || fetch(request)),
  );
});
