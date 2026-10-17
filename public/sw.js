const SHELL_CACHE = "africhiko-shell-v2";
const MEDIA_CACHE = "africhiko-media-v2";
const APP_SHELL = ["/", "/services", "/offline", "/africhiko-mark.svg", "/manifest.webmanifest"];
const SHELL_LIMIT = 100;
const MEDIA_LIMIT = 60;

self.addEventListener("install", event => event.waitUntil(precacheShell()));

async function precacheShell() {
  const cache = await caches.open(SHELL_CACHE);
  const discovered = new Set();
  for (const path of APP_SHELL) {
    try {
      const request = new Request(path, { cache: "reload" });
      const response = await fetch(request);
      if (!response.ok) continue;
      await cache.put(request, response.clone());
      if (!(response.headers.get("content-type") || "").includes("text/html")) continue;
      const html = await response.text();
      for (const match of html.matchAll(/(?:src|href)=["'](\/_next\/static\/[^"']+)["']/g)) discovered.add(match[1]);
    } catch {
      // A failed optional precache must not prevent the public site from loading.
    }
  }
  await Promise.all([...discovered].map(async path => {
    try {
      const request = new Request(path, { cache: "reload" });
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response);
    } catch {
      // Missing build assets remain network-only.
    }
  }));
  await trim(SHELL_CACHE, SHELL_LIMIT);
  await self.skipWaiting();
}

self.addEventListener("activate", event => event.waitUntil((async () => {
  const names = await caches.keys();
  await Promise.all(names
    .filter(name => (name.startsWith("the-plug-") || name.startsWith("africhiko-")) &&
      name !== SHELL_CACHE && name !== MEDIA_CACHE)
    .map(name => caches.delete(name)));
  await self.clients.claim();
})()));

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

async function trim(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  while (keys.length > limit) await cache.delete(keys.shift());
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache private or stateful customer/admin routes.
  if (/^\/(?:api|admin|account|enquiry|basket|request)(?:\/|$)/.test(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && ["/", "/services", "/offline"].includes(url.pathname)) {
          const cache = await caches.open(SHELL_CACHE);
          await cache.put(url.pathname, response.clone());
          await trim(SHELL_CACHE, SHELL_LIMIT);
        }
        return response;
      } catch {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match(url.pathname)) ||
          (await cache.match("/offline")) ||
          Response.error();
      }
    })());
    return;
  }

  // Cache only explicitly public media and brand assets, never arbitrary same-origin images.
  const publicAsset = /^\/(?:videos|images)\//.test(url.pathname) ||
    /^\/africhiko-[\w-]+\.(?:svg|png|webp|jpg|jpeg|ico)$/i.test(url.pathname);
  if (request.destination === "image" && publicAsset) {
    event.respondWith((async () => {
      const cache = await caches.open(MEDIA_CACHE);
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
          await trim(MEDIA_CACHE, MEDIA_LIMIT);
        }
        return response;
      } catch {
        return (await cache.match(request)) || Response.error();
      }
    })());
  }
});
