// // public/service-worker.js
// self.addEventListener("push", (event) => {
//   if (!event.data) {
//     console.log("Push event but no data");
//     return;
//   }
//   const payload = event.data.json();
//   console.log("📩 Push received:", payload);

//   const title = payload.title || "Notification";
//   const options = {
//     body: payload.body || "",
//     icon: payload.icon || "/icons/icon-192x192.png",
//     badge: payload.badge || "/icons/badge.png",
//     data: payload.data || {},
//     timestamp: Date.now()
//   };

//   event.waitUntil(self.registration.showNotification(title, options));
// });

// self.addEventListener("notificationclick", (event) => {
//   event.notification.close();
//   const url = event.notification.data?.url || "/";
//   event.waitUntil(
//     clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
//       for (const client of clientList) {
//         if (client.url === url && "focus" in client) return client.focus();
//       }
//       if (clients.openWindow) return clients.openWindow(url);
//     })
//   );
// });

// public/service-worker.js

// ⚙️ Install event - cache basic assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installed");
  event.waitUntil(
    caches.open("otthor-cache-v1").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/manifest.json",
        "/icons/OTTHORicon.png"
      ]);
    })
  );
  self.skipWaiting(); // activate immediately
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activated");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== "otthor-cache-v1")
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});


// ⚙️ Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activated");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== "otthor-cache-v1").map((key) => caches.delete(key)))
    )
  );
  self.clients.claim(); // take control of open pages
});

// ⚙️ Fetch event - serve from cache first, fallback to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// 🔔 Push notification event
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.log("Push event but no data");
    return;
  }

  const payload = event.data.json();
  console.log("📩 Push received:", payload);

  const title = payload.title || "Notification";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: payload.badge || "/icons/badge.png",
    data: payload.data || { url: "/" },
    timestamp: Date.now(),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 👆 Handle notification clicks (open the target URL)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
