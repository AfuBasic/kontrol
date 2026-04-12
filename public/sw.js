self.addEventListener('push', function (event) {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }

    if (event.data) {
        const data = event.data.json();
        const title = data.title || 'New Notification';
        const options = {
            body: data.message || data.body || '',
            icon: '/assets/images/app-icon.png',
            badge: '/favicon.svg',
            data: data, // Store the whole data object for click handling
            tag: data.tag || 'general-notification',
            renotify: true,
            vibrate: [100, 50, 100],
        };

        event.waitUntil(self.registration.showNotification(title, options));
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const data = event.notification.data;
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
