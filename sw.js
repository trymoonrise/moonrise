/**
 * Moonrise Studio service worker - PWA install + Web Push for client alerts.
 * Pages and app scripts stay network-first so a bad cached file cannot stick.
 * Other assets refresh in the background.
 */
const CACHE_NAME = "ms-pwa-v73-auth";
const CORE_ASSETS = ["./css/studio.css", "./css/studio-motion.css", "./index.html"];

function isAssetPath(pathname) {
  return /\.(?:html?|js|css)$/i.test(pathname) || pathname.endsWith("/");
}

function isHtmlPath(pathname) {
  return /\.html?$/i.test(pathname) || pathname.endsWith("/");
}

function isScriptOrStyle(pathname) {
  return /\.(?:js|css)$/i.test(pathname);
}

function isCriticalStudioScript(pathname) {
  return /\/js\/(?:config|builder|leads-search|auth-gate-head|auth|supabase-client|auth-security|app|install-hint)\.js$/i.test(
    pathname
  );
}

function isCriticalStudioStyle(pathname) {
  return /\/css\/(?:studio|leads-map|ms-lf-slide)\.css$/i.test(pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function networkFirst(req, fallbackUrl) {
  return fetch(req)
    .then((res) => {
      if (res && res.status === 200 && res.type === "basic") {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
      }
      return res;
    })
    .catch(() =>
      caches.match(req).then((cached) => cached || (fallbackUrl ? caches.match(fallbackUrl) : null) || Response.error())
    );
}

function staleWhileRevalidate(req, fallbackUrl) {
  return caches.open(CACHE_NAME).then((cache) =>
    cache.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            cache.put(req, res.clone()).catch(() => {});
          }
          return res;
        })
        .catch(() => cached || (fallbackUrl ? cache.match(fallbackUrl) : null) || Response.error());
      return cached || network;
    })
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch (_) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  const navigate = req.mode === "navigate" || isHtmlPath(url.pathname);
  const liveAsset = isAssetPath(url.pathname);

  if (navigate) {
    event.respondWith(networkFirst(req, "./index.html"));
    return;
  }

  if (liveAsset && isScriptOrStyle(url.pathname)) {
    if (isCriticalStudioScript(url.pathname) || isCriticalStudioStyle(url.pathname)) {
      event.respondWith(networkFirst(req));
      return;
    }
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200 && res.type === "basic") {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached || Response.error());
        return cached || network;
      })
    );
    return;
  }

  if (liveAsset) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || Response.error()))
    );
  }
});

function pushPayloadFromEvent(event) {
  let data = {};
  try {
    if (event.data) data = event.data.json();
  } catch (_) {
    try {
      const text = event.data?.text?.() || "";
      data = text ? { body: text } : {};
    } catch (_) {
      data = {};
    }
  }
  return data && typeof data === "object" ? data : {};
}

function resolveNotifyUrl(raw) {
  const fallback = "./clients.html";
  const value = String(raw || fallback).trim() || fallback;
  try {
    return new URL(value, self.registration.scope).href;
  } catch (_) {
    return new URL(fallback, self.registration.scope).href;
  }
}

self.addEventListener("push", (event) => {
  const data = pushPayloadFromEvent(event);
  const title = String(data.title || "Moonrise").trim() || "Moonrise";
  const options = {
    body: String(data.body || "You have a new update.").trim(),
    icon: "./doc/MoonriseLogo.png",
    badge: "./doc/MoonriseLogo.png",
    tag: String(data.tag || "moonrise").trim() || "moonrise",
    renotify: true,
    data: {
      url: resolveNotifyUrl(data.url || "clients.html"),
      projectId: data.projectId || null,
    },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = resolveNotifyUrl(event.notification?.data?.url || "clients.html");
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (typeof client.focus === "function") {
          if ("navigate" in client && typeof client.navigate === "function") {
            return client.focus().then(() => client.navigate(target)).catch(() => client.focus());
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
      return undefined;
    })
  );
});
