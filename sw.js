// Service Worker for ccooffee PWA
const CACHE_NAME = 'ccooffee-v12';
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
    // Immediately take control - don't wait for old SW to die
    self.skipWaiting();

    event.waitUntil(
        // Delete ALL old caches first, then cache fresh
        caches.keys().then(keys =>
            Promise.all(keys.map(key => caches.delete(key)))
        ).then(() =>
            caches.open(CACHE_NAME).then(cache => {
                console.log('✅ Caching fresh assets v12...');
                return cache.addAll(ASSETS_TO_CACHE.map(url => new Request(url, { cache: 'reload' })))
                    .catch(err => console.warn("Some assets could not be cached:", err));
            })
        )
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        // Claim all clients immediately so new SW takes over without waiting for reload
        self.clients.claim().then(() => {
            // Delete any leftover old caches
            return caches.keys().then(keys =>
                Promise.all(keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
                )
            );
        })
    );
});

// Fetch Event - Network First for JS/CSS, Cache First for assets
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    // Let Firebase / Nominatim API calls pass through completely untouched
    if (event.request.url.includes('firestore.googleapis.com') ||
        event.request.url.includes('identitytoolkit.googleapis.com') ||
        event.request.url.includes('nominatim.openstreetmap.org') ||
        event.request.url.includes('googleapis.com') ||
        event.request.url.includes('gstatic.com') ||
        event.request.url.includes('cdnjs.cloudflare.com') ||
        event.request.url.includes('unpkg.com') ||
        event.request.url.includes('jsdelivr.net')) {
        return;
    }

    // Network-first for JS and CSS (always get latest code)
    const url = new URL(event.request.url);
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                }
                return networkResponse;
            }).catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-first for everything else (images, fonts, etc.)
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                }
                return networkResponse;
            });
        })
    );
});
