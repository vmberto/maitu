/// <reference lib="webworker" />
import { immutable, assets } from '$app/manifest';
import { version } from '$app/env';
import { isLegacyCache } from '../lib/offline/model';
import { readStartup, change } from '../lib/offline/storage';
import { self } from '$app/service-worker';
const name = `maitu-svelte-shell-${version}`;
const routes = [
  '/',
  '/tasks',
  '/timeline',
  '/tasks/map',
  '/archived',
  '/login',
];
const urls = [
  ...immutable.map((file) => `/${file.path.replace(/^\//, '')}`),
  ...assets
    .map((file) => `/${file.path.replace(/^\//, '')}`)
    .filter((path) => !/\/\.|\/(?:sw|swe-worker).*\.js$/.test(path)),
  ...routes,
];
self.addEventListener('install', (event) =>
  event.waitUntil(
    (async () => {
      const cache = await caches.open(name);
      try {
        await cache.addAll(urls);
      } catch (error) {
        await caches.delete(name);
        throw error;
      }
    })(),
  ),
);
self.addEventListener('activate', (event) =>
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      for (const client of await self.clients.matchAll({ type: 'window' }))
        client.postMessage({ type: 'MAITU_UPDATED' });
    })(),
  ),
);
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/')
  )
    return;
  if (event.request.mode === 'navigate' && routes.includes(url.pathname)) {
    event.respondWith(
      caches
        .open(name)
        .then(
          async (cache) => (await cache.match('/')) ?? fetch(event.request),
        ),
    );
    return;
  }
  if (urls.includes(url.pathname))
    event.respondWith(
      caches
        .open(name)
        .then(
          async (cache) =>
            (await cache.match(url.pathname)) ?? fetch(event.request),
        ),
    );
});

self.addEventListener('push', (event) => {
  let data;
  try {
    data = event.data?.json() ?? {};
  } catch {
    return;
  }
  event.waitUntil((async () => {
    const { account } = await readStartup();
    if (!account || String(account.user._id) !== data.accountId || typeof data.deliveryId !== 'string') return;
    const task = account.tasks.find((item) => item._id === data.taskId);
    const list = account.lists.find((item) => item._id === String(task?.listId));
    const pendingTask = account.queue.some((op) => op.kind === 'tasks' && op.entityId === data.taskId);
    const pendingReminder = account.queue.some((op) => op.kind === 'tasks' && op.entityId === data.taskId && 'reminder' in op.data);
    const pendingList = account.queue.some((op) => op.kind === 'lists' && op.entityId === String(task?.listId));
    // Closed devices may have stale snapshots. Trust the server except for this device's unsynced changes.
    if ((pendingTask && (task?.deleted || (task as any)?.complete || (task as any)?.archived || (task as any)?.type === 'note')) ||
      (pendingReminder && (task as any)?.reminder?.id !== data.reminderId) ||
      (pendingList && (list?.deleted || (list as any)?.archived))) return;
    let duplicate = false;
    await change<string[]>('pushSeen', (seen = []) => {
      duplicate = seen.includes(data.deliveryId);
      return duplicate ? seen : [...seen.slice(-199), data.deliveryId];
    });
    if (duplicate) return;
    try {
      await self.registration.showNotification(data.title || 'Maitu', {
        body: data.message, icon: '/icons/icon-192x192.png?v=4', tag: data.deliveryId,
        data: { url: data.url },
      });
    } catch (error) {
      await change<string[]>('pushSeen', (seen = []) => seen.filter((id) => id !== data.deliveryId));
      throw error;
    }
  })());
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url ?? '/', self.location.origin);
  if (target.origin !== self.location.origin || !['/', '/tasks'].includes(target.pathname)) return;
  event.waitUntil(self.clients.matchAll({ type: 'window' }).then(async (clients) => {
    const client = clients[0];
    if (client) { await client.navigate(target.href); return client.focus(); }
    return self.clients.openWindow(target.href);
  }));
});

// Retire old shells only after every open app window confirms the new build.
async function retireOldShells() {
  const clients = await self.clients.matchAll({ type: 'window' });
  if (!clients.length) return;
  const versions = await Promise.all(
    clients.map(
      (client) =>
        new Promise<string | null>((resolve) => {
          const channel = new MessageChannel();
          const timer = setTimeout(() => {
            channel.port1.close();
            resolve(null);
          }, 1500);
          channel.port1.onmessage = (event) => {
            clearTimeout(timer);
            channel.port1.close();
            resolve(event.data);
          };
          client.postMessage({ type: 'REPORT_VERSION' }, [channel.port2]);
        }),
    ),
  );
  if (versions.some((value) => value !== version)) return;
  for (const key of await caches.keys())
    if (
      key !== name &&
      (key.startsWith('maitu-shell-') ||
        key.startsWith('maitu-svelte-shell-') ||
        isLegacyCache(key))
    )
      await caches.delete(key);
}
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLIENT_READY') event.waitUntil(retireOldShells());
});
