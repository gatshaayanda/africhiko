const CACHE_VERSION = "theplug-shell-v14";
const SHELL_CACHE = CACHE_VERSION;
const STATIC_LIMIT = 100;
const PUBLIC_PAGE_LIMIT = 12;
const APP_SHELL = ["/", "/request", "/offline", "/plug-icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    await precacheShell();
    // Install the new routing/cache policy immediately; the page is not force-reloaded.
    await self.skipWaiting();
  })());
});

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
    await Promise.all(keys.filter(key => key.startsWith("theplug-shell-") && key !== SHELL_CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

// Handle background Firebase Cloud Messaging pushes in The Plug's existing PWA worker.
self.addEventListener("push", event => {
  event.waitUntil((async () => {
    let payload = {};
    try {
      payload = event.data ? event.data.json() : {};
    } catch {
      payload = { notification: { body: event.data?.text() || "" } };
    }
    const notification = payload.notification || {};
    const data = payload.data || {};
    const title = notification.title || data.title || "The Plug update";
    const body = notification.body || data.body || "Open The Plug to check your latest update.";
    const requestedLink = data.link || notification.click_action || "/account";
    let link = "/account";
    try {
      const target = new URL(requestedLink, self.location.origin);
      if (target.origin === self.location.origin) link = target.pathname + target.search + target.hash;
    } catch {}
    await self.registration.showNotification(title, {
      body,
      icon: notification.icon || "/plug-icon.svg",
      badge: notification.badge || "/plug-icon.svg",
      tag: notification.tag || data.tag || undefined,
      data: { link }
    });
  })());
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil((async () => {
    const requestedLink = event.notification.data?.link || "/account";
    let targetUrl = new URL("/account", self.location.origin).href;
    try {
      const target = new URL(requestedLink, self.location.origin);
      if (target.origin === self.location.origin) targetUrl = target.href;
    } catch {}
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin !== self.location.origin) continue;
      if ("navigate" in client) await client.navigate(targetUrl).catch(() => {});
      await client.focus();
      return;
    }
    await self.clients.openWindow(targetUrl);
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;

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
