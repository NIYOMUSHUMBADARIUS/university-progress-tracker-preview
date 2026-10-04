const CACHE_NAME = 'university-progress-hub-v2';
const APP_URL = new URL('./', self.registration.scope).href;
self.addEventListener('install', (event) => {
    event.waitUntil(
        self.skipWaiting()
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin) return;

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(APP_URL, copy)));
                    }
                    return response;
                })
                .catch(async () => (await caches.match(APP_URL)) || Response.error())
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => cached || fetch(request).then((response) => {
            if (response.ok) {
                const copy = response.clone();
                event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
            }
            return response;
        }))
    );
});
