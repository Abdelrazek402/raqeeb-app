// Service Worker for Raqeeb PWA
const CACHE_NAME = 'raqeeb-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        return caches.match('/') || caches.match('/index.html');
      });
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { 
    title: 'رَقِيب | الرفيق الرقمي الواعي', 
    body: 'تذكير بذكر الله وطاعته',
    data: { url: '/?tab=adhkar' }
  };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    try {
      data.body = event.data.text();
    } catch (_) {}
  }

  const targetUrl = (data.data && data.data.url) ? data.data.url : '/?tab=adhkar';

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [150, 80, 150, 80, 250],
    data: { 
      url: targetUrl,
      category: data.data?.category || 'morning',
      timestamp: Date.now()
    },
    tag: data.tag || 'raqeeb-adhkar-alert',
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'open_athkar', title: '📿 قراءة الأذكار الآن' },
      { action: 'dismiss', title: 'إغلاق' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/?tab=adhkar';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus and navigate to athkar
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Support Periodic Background Sync when registered by browser
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'raqeeb-daily-athkar') {
    event.waitUntil(
      self.registration.showNotification('رَقِيب | وِرد الأذكار اليومي 📿', {
        body: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ.. افتح وردك الآن ورطّب لسانك بالذكر.',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        dir: 'rtl',
        lang: 'ar',
        data: { url: '/?tab=adhkar' }
      })
    );
  }
});
