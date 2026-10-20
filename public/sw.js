importScripts(
  "https://www.gstatic.com/firebasejs/11.9.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/11.9.0/firebase-messaging-compat.js",
  "/api/firebase/messaging-sw-config"
);

let africhikoMessaging = null;
try {
  const config = self.__AFRICHIKO_FIREBASE_CONFIG__;
  if (config && config.apiKey && config.projectId && config.messagingSenderId && config.appId) {
    firebase.initializeApp(config);
    africhikoMessaging = firebase.messaging();
    africhikoMessaging.onBackgroundMessage((payload) => {
      // Notification payloads are displayed automatically by Firebase. Only render
      // data-only pushes here to avoid showing the same notification twice.
      if (payload.notification) return;
      const title = payload.data?.title || "Africhiko update";
      const options = {
        body: payload.data?.body || "Open Africhiko to check your latest account information.",
        icon: "/africhiko-icon-192.png",
        badge: "/africhiko-icon-192.png",
        data: { link: payload.data?.link || "/account" },
      };
      self.registration.showNotification(title, options);
    });
  } else {
    console.error("Africhiko Firebase Messaging web config is incomplete.");
  }
} catch (error) {
  console.error("Africhiko Firebase Messaging service worker could not initialize.", error);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawLink = event.notification.data?.link || "/account";
  const link = rawLink.startsWith("/") ? rawLink : "/account";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const client of list) {
      if ("focus" in client) {
        void client.navigate(link);
        return client.focus();
      }
    }
    return clients.openWindow(link);
  }));
});

const CACHE_VERSION = "africhiko-shell-v24";
const MEDIA_CACHE = "africhiko-media-v2";
// Keep workshop clips available offline so service cards retain their visual behaviour.
const MEDIA_ASSETS = ["/videos/enter.mp4", "/videos/gear.mp4", "/videos/outside.mp4"];
const SHELL_CACHE = CACHE_VERSION;
const STATIC_LIMIT = 100;
const PUBLIC_PAGE_LIMIT = 12;
const APP_SHELL = ["/", "/services", "/basket", "/enquiry", "/request", "/offline", "/africhiko-icon-180.png", "/africhiko-icon-192.png", "/africhiko-icon-512.png", "/africhiko-icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    await precacheShell();
    await precacheMedia();
    // Install the new routing/cache policy immediately; the page is not force-reloaded.
    await self.skipWaiting();
  })());
});

async function precacheMedia() {
  const cache = await caches.open(MEDIA_CACHE);
  await Promise.all(MEDIA_ASSETS.map(async path => {
    try {
      const request = new Request(path, { cache: "reload" });
      const response = await fetch(request);
      if (response.ok && response.status === 200 && !response.headers.has("content-range")) await cache.put(request, response.clone());
    } catch {
      // A flaky connection must not prevent the app shell from installing.
    }
  }));
}

async function precacheShell() {
  const shell = await caches.open(SHELL_CACHE);
  const discovered = new Set();
  for (const path of APP_SHELL) {
    try {
      const request = new Request(path, { cache: "reload" });
      const response = await fetch(request);
      if (!response.ok) continue;
      await shell.put(request, response.clone());
      if (!(response.headers.get("content-type") || "").includes("text/html")) continue;
      const html = await response.text();
      for (const match of html.matchAll(/(?:src|href)=["'](\/_next\/static\/[^"']+)["']/g)) discovered.add(match[1]);
    } catch {}
  }
  await Promise.all([...discovered].map(async path => {
    try {
      const request = new Request(path, { cache: "reload" });
      const response = await fetch(request);
      if (response.ok) await shell.put(request, response);
    } catch {}
  }));
  await trimCache(SHELL_CACHE, STATIC_LIMIT);
}

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => (key.startsWith("africhiko-shell-") && key !== SHELL_CACHE) || (key.startsWith("africhiko-media-") && key !== MEDIA_CACHE) || key.startsWith("theplug-shell-") || key.startsWith("theplug-media-")).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;

  if (MEDIA_ASSETS.includes(url.pathname)) {
    event.respondWith(mediaResponse(request));
    return;
  }

  const isNavigation = request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");
  const isPrivate = /^\/(?:account|requests|orders|admin|invite)(?:\/|$)/.test(url.pathname);

  // Private/member routes are network-only. Never serve a cached account/request page as
  // a substitute for a different route or when the authenticated page cannot be fetched.
  if (isNavigation && isPrivate) {
    event.respondWith(fetch(request).catch(() => caches.open(SHELL_CACHE).then(cache => cache.match("/offline")).then(response => response || Response.error())));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/manifest.webmanifest" || /\.(?:css|js|woff2?|ttf|otf|png|jpe?g|webp|svg|ico|avif)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isNavigation) {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) void caches.open(SHELL_CACHE).then(async cache => {
        await cache.put(request, response.clone());
        await trimCache(SHELL_CACHE, PUBLIC_PAGE_LIMIT + STATIC_LIMIT);
      });
      return response;
    }).catch(async () => {
      const cache = await caches.open(SHELL_CACHE);
      return await cache.match(request) || await cache.match("/") || await cache.match("/offline") || Response.error();
    }));
  }
});

async function mediaResponse(request) {
  const cache = await caches.open(MEDIA_CACHE);
  const cacheKey = new Request(new URL(request.url).pathname, { method: "GET" });
  let complete = await cache.match(cacheKey);
  if (!complete) {
    try {
      const response = await fetch(cacheKey);
      if (response.ok && response.status === 200 && !response.headers.has("content-range")) {
        try { await cache.put(cacheKey, response.clone()); } catch {}
        complete = response;
      } else if (request.headers.has("range")) {
        return await fetch(request);
      } else {
        return response;
      }
    } catch {
      return Response.error();
    }
  }
  const range = request.headers.get("range");
  if (!range) return complete;
  const bytes = await complete.arrayBuffer();
  const size = bytes.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match || (!match[1] && !match[2])) {
    return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + size, "Accept-Ranges": "bytes" } });
  }
  let start;
  let end;
  if (!match[1]) {
    const suffix = Number(match[2]);
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) {
    return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + size, "Accept-Ranges": "bytes" } });
  }
  const headers = new Headers();
  headers.set("Content-Type", complete.headers.get("content-type") || "video/mp4");
  headers.set("Content-Length", String(end - start + 1));
  headers.set("Content-Range", "bytes " + start + "-" + end + "/" + size);
  headers.set("Accept-Ranges", "bytes");
  return new Response(bytes.slice(start, end + 1), { status: 206, statusText: "Partial Content", headers });
}

async function cacheFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      await trimCache(SHELL_CACHE, STATIC_LIMIT + PUBLIC_PAGE_LIMIT);
    }
    return response;
  } catch {
    return Response.error();
  }
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map(request => cache.delete(request)));
}
