/**
 * Service Worker — app shell precache + stale-while-revalidate for API.
 */

const CACHE_NAME = "crosstide-v1";
const APP_SHELL = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  const e = event as ExtendableEvent;
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  const e = event as ExtendableEvent;
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      ),
  );
});

self.addEventListener("fetch", (event) => {
  const e = event as FetchEvent;
  const url = new URL(e.request.url);

  // API: stale-while-revalidate
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(staleWhileRevalidate(e.request));
    return;
  }

  // App shell: cache-first
  e.respondWith(caches.match(e.request).then((cached) => cached ?? fetch(e.request)));
});

async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) void cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached ?? new Response("Offline", { status: 503 }));

  return cached ?? fetchPromise;
}
