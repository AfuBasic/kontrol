const CACHE_NAME = 'kontrol-pwa-v1';
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/favicon.svg',
    '/assets/images/app-icon.png',
    '/assets/icons/icon-192.webp',
    '/assets/icons/icon-512.webp',
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('PWA: Failed to cache initial static assets', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activate Event - Cache cleanup
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Network first strategy for documents, stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Bypasses non-GET or cross-origin requests
    if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) {
        return;
    }

    // Skip API, webhooks, or authentication endpoints
    if (request.url.includes('/api/') || request.url.includes('/auth/') || request.url.includes('/logout')) {
        return;
    }

    // Static Asset Caching (Stale While Revalidate)
    if (request.destination === 'image' || request.destination === 'font' || request.destination === 'style' || request.destination === 'script') {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(request).then((cachedResponse) => {
                    const fetchPromise = fetch(request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => cachedResponse);

                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // Navigation / Document requests: Network-First with Offline Fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => {
                return caches.match(request).then((cached) => {
                    return cached || caches.match('/');
                });
            })
        );
    }
});

// Push Notifications
self.addEventListener('push', function (event) {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }

    if (event.data) {
        let data = {};
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Kontrol Notification', body: event.data.text() };
        }

        const title = data.title || 'New Notification';
        const options = {
            body: data.message || data.body || '',
            icon: '/assets/images/app-icon.png',
            badge: '/favicon.svg',
            data: data,
            tag: data.tag || 'general-notification',
            renotify: true,
            vibrate: [100, 50, 100],
        };

        event.waitUntil(self.registration.showNotification(title, options));
    }
});

// Notification Click Handler
self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const data = event.notification.data || {};
    const urlToOpen = data.action_url || data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
