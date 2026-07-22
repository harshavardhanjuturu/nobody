// Nobody Service Worker — Web Push Notifications
self.addEventListener('push', function (event) {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'Nobody', body: event.data.text() };
  }

  const title = data.title || 'Nobody';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'nobody-notification',
    renotify: true,
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
