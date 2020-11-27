// This file is the clone of generated `service-worker.js` to add push notification functionality
/*global importScripts workbox clients*/

importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.3/workbox-sw.js');
importScripts('/precache-manifest.|PRECACHE_MANIFEST_HASH|.js');

workbox.skipWaiting();
workbox.clientsClaim();

self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.routing.registerNavigationRoute('/index.html', {
    blacklist: [/^\/_/, /\/[^/]+\.[^/]+$/, /^\/external/]
});

self.addEventListener('push', function(event) {
    var data = event.data.json();
    var promise = self.registration.showNotification(data.title, data);
    event.waitUntil(promise);
});

self.addEventListener('notificationclick', function(event) {
    var data = event.notification.data;
    var url = 'https://www.classbuzz.ml';

    if (data && data.url) {
        url = data.url;
    }

    event.notification.close(); // Android needs explicit close.
    event.waitUntil(
        clients
            .matchAll({
                includeUncontrolled: true,
                type: 'window'
            })
            .then(function(windowClients) {
                // Check if there is already a window/tab open with the target URL
                for (var i = 0; i < windowClients.length; i++) {
                    var client = windowClients[i];
                    // If so, just focus it.
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If not, then open the target URL in a new window/tab.
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});
