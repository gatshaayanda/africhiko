importScripts("https://www.gstatic.com/firebasejs/11.9.0/firebase-app-compat.js","https://www.gstatic.com/firebasejs/11.9.0/firebase-messaging-compat.js");

// Push handling is additive: keep Africhiko's existing install, cache, update and
// offline-fetch behaviour below unchanged. Firebase config is public web config.
fetch("/api/notifications/config", { cache: "no-store" })
  .then(response => { if (!response.ok) throw new Error("Firebase messaging config unavailable"); return response.json(); })
  .then(config => {
    if (!firebase.apps.length) firebase.initializeApp(config);
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage(payload => {
      const data = payload.data || {};
      return self.registration.showNotification(data.title || "Africhiko update", {
        body: data.body || "There is an update to your project enquiry.",
        icon: "/africhiko-icon.svg",
        badge: "/africhiko-icon.svg",
        tag: "africhiko-" + (data.enquiryId || "update"),
        data: { link: typeof data.link === "string" && data.link.startsWith("/") ? data.link : "/account" }
      });
    });
  })
  .catch(error => { console.warn("Africhiko background notifications are not configured yet.", error); });

const CACHE_NAME = "africhiko-shell-v1";
const APP_SHELL = ["/", "/services", "/enquiry", "/basket", "/account", "/offline", "/africhiko-icon.svg"];
const PUBLIC_MEDIA = ["/videos/enter.mp4", "/videos/gear.mp4", "/videos/outside.mp4"];

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

  const publicAsset = ["/videos/", "/images/", "/fonts/"].some(prefix => url.pathname.startsWith(prefix))
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
