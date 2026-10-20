const CACHE_NAME = "namane-tyres-shell-v4";
const APP_SHELL = ["/", "/book", "/offline", "/icon.svg"];
const PUBLIC_MEDIA = [
  "/namane-assets/work-location.jpg",
  "/namane-assets/passing-car.jpg",
  "/namane-assets/zoom-in-work-on-tyres.mp4",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)),
      ))
      .then(() => {
        // Pre-cache the small public images immediately. The video is attempted in
        // the background so installation itself is not blocked by a large download.
        return caches.open(CACHE_NAME).then(cache => {
          void cache.addAll(PUBLIC_MEDIA).catch(() => {
            // If the device is offline or the video download is interrupted,
            // normal fetch handling below can retry when connectivity returns.
          });
        });
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) return;
  const url = new URL(request.url);

  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) void caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    })));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) void caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request).then(cached => cached || caches.match(url.pathname) || caches.match("/offline"))));
    return;
  }

  const publicAsset = ["/namane-assets/", "/images/", "/fonts/"].some(prefix => url.pathname.startsWith(prefix))
    || /\.(?:css|woff2?|ttf|otf|png|jpe?g|webp|svg|ico|avif|mp4|webm)$/i.test(url.pathname);

  if (publicAsset) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) void caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    })));
    return;
  }

  event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
});
