// Service Worker for ccooffee PWA
const CACHE_NAME = 'ccooffee-v10';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './css/mobile-optimizations.css',
    './css/ui-fixes.css',
    './css/auth-style.css',
    './css/warning-style.css',
    './js/app.js',
    './js/auth.js',
    './js/firebase-config.js',
    './js/particle-bg.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Caching App Assets...');
            // Using catch to prevent failure if some files don't exist yet
            return cache.addAll(ASSETS_TO_CACHE.map(url => new Request(url, { cache: 'reload' })))
                .catch(err => console.warn("Some assets could not be cached."));
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Stale-While-Revalidate for app files, Ignore Firebase/API requests
self.addEventListener('fetch', event => {
    // Only intercept GET requests
    if (event.request.method !== 'GET') return;

    // Let Firebase / Nominatim API calls pass through completely untouched
    if (event.request.url.includes('firestore.googleapis.com') ||
        event.request.url.includes('identitytoolkit.googleapis.com') ||
        event.request.url.includes('nominatim.openstreetmap.org')) {
        return;
    }

    // Stale-While-Revalidate strategy
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                // Cache the new response if valid
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(err => {
                console.warn('Network request failed, serving from cache if available:', err);
            });

            // Return cached immediately if available, otherwise wait for network
            return cachedResponse || fetchPromise;
        })
    );
});
