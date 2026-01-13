const CACHE_NAME = 'chirp-cache-v2';
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
  const requestUrl = event.request.url;
  const requestMethod = event.request.method;
  
  // Don't intercept API calls, SSE connections, non-GET requests, or cross-origin requests
  // These should never be cached and should always go directly to the server
  // By returning early without calling event.respondWith(), the browser handles the request normally
  const isApiCall = requestUrl.includes('/api/');
  const isBlob = requestUrl.startsWith('blob:');
  const isEventStream = event.request.headers.get('Accept') === 'text/event-stream' || requestUrl.includes('event-stream');
  const isNonGet = requestMethod !== 'GET';
  
  // Check if request is going to a different origin (e.g., API server)
  const requestOrigin = new URL(requestUrl).origin;
  const currentOrigin = self.location.origin;
  const isCrossOrigin = requestOrigin !== currentOrigin;
  
  if (isApiCall || isBlob || isEventStream || isNonGet || isCrossOrigin) {
    // Don't call event.respondWith() - let the browser handle these requests directly
    // This completely bypasses the service worker for these requests
    return;
  }

  event.respondWith(
    fetch(event.request.clone())
      .then((response) => {
        // Only cache static assets (images, CSS, JS)
        if (response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
           caches.open(CACHE_NAME).then((cache) => {
             cache.put(event.request.clone(), responseToCache).catch((err) => {
              console.debug('Cache put error:', err.message);
            });
          }).catch((err) => {
            console.debug('Cache open error:', err.message);
          });
        }
        return response;
      })
      .catch((error) => {
        // Fallback to cache on network error
        return caches.match(event.request.clone()).then((cachedResponse) => {
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
