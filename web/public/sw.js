/*
 * Offline support.
 *
 * The catalogue never changes between deploys, so it is cached outright: a
 * child on a phone with no signal can still open every doa. Code and markup
 * go to the network first, so a new deploy is picked up as soon as there is a
 * connection instead of being pinned to an old build.
 */
const CACHE = "hafalku-v1";
const PRECACHE = ["/", "/content/dua.json", "/brand/doaku-logo.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, fallbackUrl) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(fallbackUrl ?? request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(fallbackUrl ?? request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "/"));
    return;
  }

  // Hashed build assets and the content bundle are safe to serve from cache.
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/brand/") || url.pathname === "/content/dua.json") {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
