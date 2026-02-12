/* Service Worker for Push Notifications - FlowMatic */

// Listen for push events
self.addEventListener('push', function(event) {
    let data = { title: 'FlowMatic', body: '', icon: '/FlowMatic.png', url: '/' };

    try {
        if (event.data) {
            data = Object.assign(data, event.data.json());
        }
    } catch (e) {
        data.body = event.data ? event.data.text() : '';
    }

    const options = {
        body: data.body,
        icon: data.icon || '/FlowMatic.png',
        badge: data.badge || '/FlowMatic.png',
        dir: 'rtl',
        lang: 'he',
        vibrate: [200, 100, 200],
        tag: data.tag || 'flowmatic-notification',
        renotify: true,
        data: {
            url: data.url || '/',
            timestamp: data.timestamp || Date.now()
        },
        actions: [
            { action: 'open', title: 'פתח' },
            { action: 'dismiss', title: 'סגור' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // Try to focus an existing window
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            // Open a new window if none found
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
    // Analytics or cleanup if needed
});
