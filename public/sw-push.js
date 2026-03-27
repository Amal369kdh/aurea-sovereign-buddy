// Custom service worker additions for push notifications
// This file is injected into the Workbox-generated SW by VitePWA

// Handle push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "",
      icon: "/favicon.png",
      badge: "/favicon.png",
      tag: data.data?.type || "default",
      renotify: true,
      data: data.data || {},
      vibrate: [200, 100, 200],
      actions: [],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "Aurea Student", options)
    );
  } catch (e) {
    console.error("Push event error:", e);
  }
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let url = "/";

  // Route based on notification type
  switch (data.type) {
    case "new_comment":
      url = "/hub-social";
      break;
    case "new_message":
      url = "/messages";
      break;
    case "new_match":
      url = "/hub-social";
      break;
    default:
      url = "/";
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});
