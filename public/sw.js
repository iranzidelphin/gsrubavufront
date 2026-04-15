const CACHE_NAME = 'gs-rubavu-v1';
const NOTIFICATION_ICON = '/favicon.svg';

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received:', event);
  
  let data = {
    title: 'Gs rubavu',
    body: 'You have a new notification',
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_ICON,
    tag: 'gs-notification',
    requireInteraction: false,
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        ...data,
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || NOTIFICATION_ICON,
        badge: payload.badge || NOTIFICATION_ICON,
        tag: payload.tag || 'ttc-notification',
        requireInteraction: payload.requireInteraction || false,
        data: payload.data || {},
        actions: payload.actions || [],
        vibrate: payload.vibrate || [200, 100, 200],
      };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      requireInteraction: data.requireInteraction,
      data: data.data,
      actions: data.actions,
      vibrate: data.vibrate,
      sound: 'default',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          return client.navigate(urlToOpen);
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
      return null;
    })
  );
});

self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});