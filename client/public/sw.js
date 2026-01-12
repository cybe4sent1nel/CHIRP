const CACHE_NAME = 'chirp-cache-v1';
const urlsToCache = [
  '/',
  '/animations/nodata.json',
  '/animations/404cat.json',
  '/animations/error 403.json',
  '/animations/Error 408.json',
  '/animations/error 500.json',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.log('Cache addAll error:', err);
        // Don't fail on cache errors
        return Promise.resolve();
      });
    })
  );
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Don't intercept API calls, SSE connections, or dynamic content
  if (event.request.url.includes('/api/') ||
      event.request.url.includes('/message/') ||
      event.request.url.includes('blob:') ||
      event.request.url.includes('localhost:')) {
    // For API calls, just fetch normally without caching
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache static assets (images, CSS, JS)
        if (response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch((err) => {
              console.debug('Cache put error:', err.message);
            });
          }).catch((err) => {
            console.debug('Cache open error:', err.message);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache on network error
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || new Response('Offline', { status: 503 });
        });
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
