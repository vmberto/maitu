import { isLegacyCache } from '@/src/lib/offline/model';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist, setCacheNameDetails } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;
setCacheNameDetails({ prefix: 'maitu-shell' });
const serwist: Serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    {
      matcher: ({ request, url }) =>
        request.mode === 'navigate' &&
        url.origin === self.location.origin &&
        ['/', '/tasks', '/timeline', '/login'].includes(url.pathname),
      handler: async ({ url }): Promise<Response> =>
        (await serwist.matchPrecache(url.pathname)) ?? fetch(url),
    },
  ],
});

// Previous versions cached personalized HTML/RSC. This release caches only static shells/assets.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter(isLegacyCache).map((name) => caches.delete(name)),
        ),
      ),
  );
});
self.addEventListener('push', (event) => {
  let data: { title?: string; message?: string };
  try {
    data = event.data?.json() ?? {};
  } catch {
    return;
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Maitu', {
      body: data.message,
      icon: '/icons/android-chrome-192x192.webp',
    }),
  );
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const client = clients.find((item) => item.focused) ?? clients[0];
      return client ? client.focus() : self.clients.openWindow('/');
    }),
  );
});
serwist.addEventListeners();
