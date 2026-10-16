import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { test, expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
const user = {
  _id: '507f191e810c19729de860ea',
  username: 'Pilot User',
  email: 'pilot@example.com',
};
const listId = '64b2f7a9c1e6f9a1b2c3d4e5';
test('adds scheduling after creation, filters calendar ranges, reschedules and removes dates offline', async ({ page, context }) => {
  await page.clock.setFixedTime(new Date('2026-10-14T15:00:00Z'));
  const server = await transport(context);
  for (const [index, title, date] of [[0, 'Undated', null], [1, 'Late task', '2026-10-12'], [2, 'Today task', '2026-10-14'], [3, 'Next week task', '2026-10-21'], [4, 'Next month task', '2026-11-02']] as const)
    server.snapshot.tasks.push({ _id: (100 + index).toString(16).padStart(24, '0'), listId, title, complete: false, createdAt: '2026-01-01', version: 0, schedule: date ? { date, timeZone: 'America/Recife' } : null });
  await page.goto(`/tasks?listId=${listId}`);
  await expect(page.getByRole('textbox', { name: 'Task Undated', exact: true })).toBeVisible();
  await expect(page.getByText('Overdue', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Task Today task', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Task Next week task', exact: true })).not.toBeVisible();
  await page.getByText('Upcoming', { exact: true }).last().click();
  await expect(page.getByRole('textbox', { name: 'Task Next week task', exact: true })).toBeVisible();
  await page.getByLabel('Date filter').selectOption('today');
  await expect(page.getByRole('textbox', { name: 'Task Today task', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Task Undated', exact: true })).toHaveCount(0);
  await page.getByLabel('Date filter').selectOption('week');
  await expect(page.getByRole('textbox', { name: 'Task Late task', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Task Next week task', exact: true })).toHaveCount(0);
  await page.getByLabel('Date filter').selectOption('month');
  await expect(page.getByRole('textbox', { name: 'Task Next week task', exact: true, includeHidden: true })).toHaveCount(1);
  await expect(page.getByRole('textbox', { name: 'Task Next month task', exact: true })).toHaveCount(0);
  await page.getByLabel('Date filter').selectOption('all');
  await expect(page.locator('.task-creation').getByText('Schedule & Reminder', { exact: true })).toHaveCount(0);
  await page.getByLabel('New task', { exact: true }).fill('Created scheduled');
  await page.getByLabel('New task', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Task details Created scheduled', exact: true }).click();
  const initialDrawer = page.getByRole('dialog');
  await expect(initialDrawer.locator('.scheduling')).toHaveCount(0);
  await initialDrawer.getByText('Options', { exact: true }).click();
  await initialDrawer.getByRole('button', { name: 'Schedule & Reminder', exact: true }).click();
  await initialDrawer.locator('.scheduling summary').click();
  await initialDrawer.getByLabel('Scheduled date', { exact: true }).fill('2026-10-21');
  await initialDrawer.getByRole('button', { name: 'Save date', exact: true }).click();
  await expect.poll(async () => (await device(page)).tasks.find((task: any) => task.title === 'Created scheduled')?.schedule?.date).toBe('2026-10-21');
  await initialDrawer.getByRole('button', { name: 'Close panel', exact: true }).click();
  const id = (await device(page)).tasks.find((task: any) => task.title === 'Created scheduled')._id;
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.goto(`/tasks?listId=${listId}&taskId=${id}`);
  const drawer = page.getByRole('dialog');
  await drawer.getByText(/Oct 21/, { exact: true }).click();
  await drawer.getByLabel('Scheduled date', { exact: true }).fill('2026-10-14');
  await drawer.getByRole('button', { name: 'Save date', exact: true }).click();
  await expect.poll(async () => (await device(page)).tasks.find((task: any) => task._id === id)?.schedule?.date).toBe('2026-10-14');
  await drawer.getByRole('button', { name: 'Remove date', exact: true }).click();
  await expect.poll(async () => (await device(page)).tasks.find((task: any) => task._id === id)?.schedule).toBeNull();
  await drawer.getByRole('button', { name: 'Close panel', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Task Created scheduled', exact: true })).toBeVisible();
});

test('keeps scheduling when notification permission is denied and requires an explicit reminder time', async ({ page, context }) => {
  await transport(context);
  await page.clock.setFixedTime(new Date('2026-10-14T15:00:00Z'));
  await page.addInitScript(() => { Object.defineProperty(Notification, 'requestPermission', { value: async () => 'denied' }); });
  await page.goto(`/tasks?listId=${listId}`);
  await page.getByLabel('New task', { exact: true }).fill('Reminder test');
  await page.getByLabel('New task', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Task details Reminder test' }).click();
  const drawer = page.getByRole('dialog');
  await drawer.getByText('Options', { exact: true }).click();
  await drawer.getByRole('button', { name: 'Schedule & Reminder', exact: true }).click();
  await drawer.locator('.scheduling summary').click();
  await drawer.getByLabel('Scheduled date', { exact: true }).fill('2026-10-16');
  await drawer.getByRole('button', { name: 'Save date', exact: true }).click();
  await drawer.getByLabel('Reminder date', { exact: true }).fill('2026-10-15');
  await drawer.getByRole('button', { name: 'Set reminder', exact: true }).click();
  await expect(drawer.getByRole('alert')).toContainText('explicit time');
  await drawer.getByLabel('Reminder time', { exact: true }).fill('09:00');
  await drawer.getByRole('button', { name: 'Set reminder', exact: true }).click();
  await expect(drawer.getByRole('alert')).toContainText('Notifications are blocked');
  expect((await device(page)).tasks.find((task: any) => task.title === 'Reminder test').schedule.date).toBe('2026-10-16');
});

test('registers a reminder independently of the scheduled date and disables it without losing the date', async ({ page, context }) => {
  await transport(context);
  await page.clock.setFixedTime(new Date('2026-10-14T15:00:00Z'));
  const registrations: any[] = [];
  await context.route('**/api/push', async (route) => {
    if (route.request().method() === 'GET') await route.fulfill({ json: { publicKey: 'A'.repeat(87) } });
    else { registrations.push(route.request().postDataJSON()); await route.fulfill({ json: { ok: true } }); }
  });
  await page.addInitScript(() => {
    Object.defineProperty(Notification, 'requestPermission', { value: async () => 'granted' });
    Object.defineProperty(PushManager.prototype, 'getSubscription', { value: async () => ({ toJSON: () => ({ endpoint: 'https://fcm.googleapis.com/fcm/send/test', keys: { p256dh: 'A'.repeat(87), auth: 'B'.repeat(22) } }) }) });
  });
  await page.goto(`/tasks?listId=${listId}`);
  await page.getByLabel('New task', { exact: true }).fill('Friday task');
  await page.getByLabel('New task', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Task details Friday task' }).click();
  const drawer = page.getByRole('dialog');
  await drawer.getByText('Options', { exact: true }).click();
  await drawer.getByRole('button', { name: 'Schedule & Reminder', exact: true }).click();
  await drawer.locator('.scheduling summary').click();
  await drawer.getByLabel('Scheduled date', { exact: true }).fill('2026-10-16');
  await drawer.getByRole('button', { name: 'Save date', exact: true }).click();
  await drawer.getByLabel('Reminder date', { exact: true }).fill('2026-10-15');
  await drawer.getByLabel('Reminder time', { exact: true }).fill('09:00');
  await drawer.getByRole('button', { name: 'Set reminder', exact: true }).click();
  await expect(drawer.getByText('Notifications enabled on this device.')).toBeVisible();
  expect(registrations.length).toBe(1);
  const saved = (await device(page)).tasks.find((task: any) => task.title === 'Friday task');
  expect(saved.reminder.at).toBe('2026-10-15T12:00:00.000Z');
  expect(saved.schedule.date).toBe('2026-10-16');
  await drawer.getByRole('button', { name: 'Disable reminder', exact: true }).click();
  await expect.poll(async () => (await device(page)).tasks.find((task: any) => task.title === 'Friday task')?.reminder).toBeNull();
  expect((await device(page)).tasks.find((task: any) => task.title === 'Friday task').schedule.date).toBe('2026-10-16');
});

test('service worker deduplicates reminders, opens the task and suppresses unsynced completion', async ({ page, context }) => {
  const server = await transport(context);
  const taskId = '64b2f7a9c1e6f9a1b2c3d4e8';
  server.snapshot.tasks.push({ _id: taskId, listId, title: 'Notification task', complete: false, createdAt: '2026-01-01', version: 0 });
  await page.goto(`/tasks?listId=${listId}`);
  await expect(page.getByLabel('Task Notification task', { exact: true })).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const worker = context.serviceWorkers()[0];
  await worker.evaluate(() => {
    const scope = self as unknown as { registration: ServiceWorkerRegistration; testNotifications: Map<string, { tag: string; data: unknown; close: () => void }> };
    scope.testNotifications = new Map();
    scope.registration.showNotification = async (_title, options) => {
      const tag = options!.tag!;
      scope.testNotifications.set(tag, { tag, data: options!.data, close: () => scope.testNotifications.delete(tag) });
    };
    scope.registration.getNotifications = async () => [...scope.testNotifications.values()] as Notification[];
  });
  const payload = { title: 'Notification task', message: 'Task reminder', deliveryId: 'device-delivery-1', reminderId: 'new-reminder-from-other-device', taskId, accountId: user._id, url: `/tasks?listId=${listId}&taskId=${taskId}` };
  const push = (data: typeof payload) => worker.evaluate((data) => {
    let work: Promise<unknown> = Promise.resolve();
    const event = new Event('push');
    Object.defineProperties(event, { data: { value: { json: () => data } }, waitUntil: { value: (promise: Promise<unknown>) => work = promise } });
    self.dispatchEvent(event);
    return work;
  }, data);
  await push(payload);
  await push(payload);
  expect(await worker.evaluate(async () => (await (self as unknown as { registration: ServiceWorkerRegistration }).registration.getNotifications()).map((notification) => notification.tag))).toEqual(['device-delivery-1']);
  await worker.evaluate(async () => {
    const notification = (await (self as unknown as { registration: ServiceWorkerRegistration }).registration.getNotifications())[0];
    let work: Promise<unknown> = Promise.resolve();
    const event = new Event('notificationclick');
    Object.defineProperties(event, { notification: { value: notification }, waitUntil: { value: (promise: Promise<unknown>) => work = promise } });
    self.dispatchEvent(event);
    // Synthetic clicks can navigate but do not carry the OS user activation required to focus.
    try { await work; } catch (error) { if ((error as DOMException).name !== 'InvalidAccessError') throw error; }
  });
  await expect(page).toHaveURL(new RegExp(`taskId=${taskId}`));
  await expect(page.getByRole('dialog').getByLabel('Task title')).toHaveValue('Notification task');
  await page.getByRole('button', { name: 'Close panel' }).click();
  await context.setOffline(true);
  await page.getByRole('button', { name: 'completeTask', exact: true }).click();
  await push({ ...payload, deliveryId: 'device-delivery-2' });
  expect(await worker.evaluate(async () => (await (self as unknown as { registration: ServiceWorkerRegistration }).registration.getNotifications()).length)).toBe(0);
});

test('map selection highlights the foreground marker and swipe cards offer directions', async ({ page, context }) => {
  const server = await transport(context);
  const ids = ['64b2f7a9c1e6f9a1b2c3d4ea', '64b2f7a9c1e6f9a1b2c3d4eb'];
  ids.forEach((id, index) => server.snapshot.tasks.push({ _id: id, listId, title: `Place ${index}`, complete: false, createdAt: '2026-01-01', version: 0, addons: ['location'], location: { name: `Place ${index}`, address: '', latitude: -8.0476 + index * .001, longitude: -34.877, source: 'manual', placeId: 'manual' } }));
  await page.goto(`/tasks/map?listId=${listId}&taskId=${ids[0]}`);
  await expect(page.locator('.selected-marker')).toHaveCount(1);
  await expect(page.locator('.map-card.active')).toHaveAttribute('data-task-id', ids[0]);
  await page.locator('.selected-marker').evaluate((marker) => (marker as HTMLElement).dataset.resumeCheck = 'preserved');
  server.snapshot.tasks[0].title = 'Updated place';
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('.map-card.active h2')).toHaveText('Updated place');
  await expect(page.locator('.selected-marker')).toHaveAttribute('data-resume-check', 'preserved');
  await expect(page.locator('.map-card.active').getByRole('link', { name: 'Directions' })).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=-8.0476,-34.877');
  await expect.poll(() => page.locator('.selected-marker').evaluate((node) => Number((node as HTMLElement).style.zIndex))).toBeGreaterThan(9000);
  await page.locator('.map-cards').evaluate((strip) => {
    strip.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    const card = strip.children[1] as HTMLElement;
    strip.scrollLeft = card.offsetLeft - (strip.clientWidth - card.clientWidth) / 2;
  });
  await expect(page.locator('.map-card.active')).toHaveAttribute('data-task-id', ids[1]);
  await expect(page.locator('.selected-marker')).toHaveCount(1);
  const previousCard = page.getByRole('button', { name: 'Focus Updated place on map' });
  const box = await previousCard.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(Math.max(5, box!.x + box!.width - 5), box!.y + 30);
  await expect(page.locator('.map-card.active')).toHaveAttribute('data-task-id', ids[0]);
});
test('cached startup renders a large saved account without network', async ({ page, context }) => {
  test.setTimeout(60000);
  const server = await transport(context);
  for (let index = 0; index < 5000; index++) server.snapshot.tasks.push({
    _id: (index + 100).toString(16).padStart(24, '0'), listId, title: `Task ${index}`, complete: false,
    createdAt: '2026-01-01', version: 0, index,
  });
  await page.goto('/');
  await expect(page.getByRole('link', { name: '📝 Pilot list' })).toBeVisible();
  await expect.poll(async () => (await device(page)).tasks.length).toBe(5000);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  const samples: number[] = [];
  for (let run = 0; run < 10; run++) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: '📝 Pilot list' })).toBeVisible();
    samples.push(await page.evaluate(() => performance.now()));
  }
  console.log(`Cached startup with 5,000 tasks: median ${samples.sort((a, b) => a - b)[5].toFixed(0)}ms, max ${Math.max(...samples).toFixed(0)}ms across 10 offline reloads`);
  await test.info().attach('cached-startup.json', { body: JSON.stringify({ tasks: 5000, samplesMs: samples }), contentType: 'application/json' });
  expect(Math.max(...samples)).toBeLessThan(1500);
});
test('undoes completion during the grace period and appends tasks after sparse indexes', async ({ page, context }) => {
  const server = await transport(context);
  server.snapshot.tasks.push({ _id: '64b2f7a9c1e6f9a1b2c3d4e9', listId, title: 'Existing', index: 100, complete: false, createdAt: '2026-01-01', version: 0 });
  await page.goto(`/tasks?listId=${listId}`);
  const toggle = page.getByRole('button', { name: 'completeTask', exact: true });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.waitForTimeout(3100);
  await expect(page.getByText('Complete Tasks', { exact: true })).toHaveCount(0);
  const input = page.getByRole('textbox', { name: 'New task', exact: true });
  await input.fill('New bottom task');
  await input.press('Enter');
  await expect.poll(() => page.locator('[data-sort-id] textarea').evaluateAll((nodes) => nodes.map((node) => (node as HTMLTextAreaElement).value))).toEqual(['Existing', 'New bottom task']);
  const saved = await device(page);
  expect(saved.tasks.find((task: any) => task.title === 'Existing').completedAt).toBeNull();
  expect(saved.tasks.find((task: any) => task.title === 'New bottom task').index).toBe(101);
});
test('searches, selects and saves a place using the location tabs', async ({ page, context }) => {
  await transport(context);
  const place = { name: 'Marco Zero', address: 'Recife, Brazil', latitude: -8.063, longitude: -34.871, source: 'openstreetmap', placeId: 'N123' };
  await page.route('**/api/places?*', (route) => route.fulfill({ json: { places: [place] } }));
  await page.goto(`/tasks?listId=${listId}`);
  await page.getByRole('textbox', { name: 'New task', exact: true }).fill('Marco Zero');
  await page.getByRole('textbox', { name: 'New task', exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Task details Marco Zero' }).click();
  await page.getByText('Options', { exact: true }).click();
  await page.getByRole('button', { name: 'Location', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search places' })).toHaveValue('Marco Zero');
  await expect(page.getByRole('textbox', { name: 'Coordinates' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('button', { name: /Marco Zero Recife/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Save location', exact: true }).click();
  await expect(page.getByRole('link', { name: 'See on Map' })).toBeVisible();
  expect((await device(page)).tasks.find((task: any) => task.title === 'Marco Zero').location).toEqual(place);
  await page.getByLabel('Location options', { exact: true }).click();
  await page.getByRole('button', { name: 'Change location', exact: true }).click();
  await expect(page.getByRole('link', { name: 'See on Map' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save location', exact: true })).toBeDisabled();
  expect((await device(page)).tasks.find((task: any) => task.title === 'Marco Zero').location).toBeNull();
  await page.getByRole('tab', { name: 'Latitude / Longitude' }).click();
  await expect(page.getByRole('textbox', { name: 'Coordinates' })).toHaveValue('');
  await expect(page.getByRole('textbox', { name: 'Coordinates' })).toHaveAttribute('placeholder', '0.0000, 0.0000');
  await expect(page.getByRole('navigation', { name: 'Your lists' })).toHaveCount(0);
});
test('login handles a deployment error returned as plain text', async ({ page }) => {
  await page.route('**/api/auth/login', (route) => route.fulfill({ status: 503, contentType: 'text/plain', body: 'The deployment is unavailable' }));
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill('test@example.com');
  await page.getByLabel('Password').fill('test-password');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Sign in service is unavailable (HTTP 503). Please try again shortly.');
  await expect(page).toHaveURL(/\/login$/);
});
test('moves a task and its subtasks to another active tasks list', async ({ page, context }) => {
  const server = await transport(context);
  const target = '64b2f7a9c1e6f9a1b2c3d4e6';
  server.snapshot.lists.push({ ...server.snapshot.lists[0], _id: target, title: 'Destination', index: 1 });
  const parent = '64b2f7a9c1e6f9a1b2c3d4e7';
  server.snapshot.tasks.push(
    { _id: parent, listId, title: 'Move me', complete: false, createdAt: '2026-01-01', version: 0 },
    { _id: '64b2f7a9c1e6f9a1b2c3d4e8', listId, parentTaskId: parent, title: 'Child', complete: false, createdAt: '2026-01-01', version: 0 },
  );
  await page.goto(`/tasks?listId=${listId}`);
  await page.getByRole('button', { name: 'Task details Move me' }).click();
  await page.getByText('Options', { exact: true }).click();
  await page.getByRole('button', { name: 'Move Task', exact: true }).click();
  await page.getByRole('combobox', { name: 'Destination list' }).selectOption(target);
  await page.getByRole('button', { name: 'Move task', exact: true }).last().click();
  await expect.poll(async () => (await device(page)).tasks.filter((task: any) => task.listId === target).length).toBe(2);
  await expect(page.getByRole('button', { name: 'Task details Move me' })).toHaveCount(0);
});
async function enableRelatedTasks(page: Page) {
  await page.getByText('Options', { exact: true }).click();
  await page.getByRole('button', { name: 'Related Tasks', exact: true }).click();
  await page.getByText('Options', { exact: true }).click();
}
async function pasteDescription(page: Page, text: string) {
  const editor = page.getByRole('textbox', { name: 'Description', exact: true });
  await editor.click();
  await editor.evaluate((node, text) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', text);
    node.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData }));
  }, text);
}
async function transport(context: BrowserContext) {
  const snapshot: { lists: any[]; tasks: any[] } = {
    lists: [
      {
        _id: listId,
        id: listId,
        title: 'Pilot list',
        emoji: '📝',
        color: 'primary',
        type: 'tasks',
        index: 0,
        version: 0,
        createdAt: '2026-01-01',
      },
    ],
    tasks: [],
  };
  let loseResponse = false;
  let writes = 0;
  const receipts = new Set<string>();
  await context.route('**/api/session', (route) =>
    route.fulfill({ json: { user } }),
  );
  await context.route('**/api/sync', async (route) => {
    expect(route.request().headers()['x-maitu-account']).toBe(user._id);
    if (route.request().method() === 'GET')
      return route.fulfill({ json: snapshot });
    const op = route.request().postDataJSON();
    const entities = snapshot[op.kind as 'lists' | 'tasks'];
    let entity = entities.find((item) => item._id === op.entityId);
    if (!receipts.has(op.id)) {
      if ((entity?.version ?? 0) !== op.baseVersion)
        return route.fulfill({
          json: { conflict: { server: entity, message: 'Newer edit' } },
        });
      if (!entity) {
        entity = { _id: op.entityId, version: 0 };
        entities.push(entity);
      }
      Object.assign(entity, op.data, {
        version: entity.version + 1,
        deleted: op.action === 'delete',
      });
      receipts.add(op.id);
      writes++;
      if (loseResponse) {
        loseResponse = false;
        return route.abort();
      }
    }
    return route.fulfill({ json: { entity } });
  });
  return {
    snapshot,
    loseNextResponse: () => (loseResponse = true),
    writes: () => writes,
  };
}
async function device(page: Page) {
  return page.evaluate(async (userId) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('maitu-offline');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const value: any = await new Promise((resolve) => {
      const req = db
        .transaction('accounts')
        .objectStore('accounts')
        .get(`user:${userId}`);
      req.onsuccess = () => resolve(req.result);
    });
    db.close();
    return value;
  }, user._id);
}

test('Svelte saves through the shared engine, reloads offline and retries a lost acknowledgement once', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  await page.goto('/');
  await expect(page.getByRole('link', { name: '📝 Pilot list' })).toBeVisible();
  const files = await page.evaluate(() =>
    Array.from(
      new Set(
        performance
          .getEntriesByType('resource')
          .map((entry) => new URL(entry.name).pathname)
          .filter((path) => path.endsWith('.js')),
      ),
    ),
  );
  const metrics = files.map((path) => {
    const content = readFileSync(`build/client${path}`);
    return { path, bytes: content.length, gzipBytes: gzipSync(content).length };
  });
  const gzipBytes = metrics.reduce((sum, item) => sum + item.gzipBytes, 0);
  expect(gzipBytes, 'Keep the lists startup JavaScript below 55 KB gzip').toBeLessThan(55000);
  console.log(
    `Svelte lists initial JavaScript: ${gzipBytes} gzip bytes across ${files.length} files`,
  );
  await test.info().attach('lists-javascript.json', {
    body: JSON.stringify({ gzipBytes, files: metrics }, null, 2),
    contentType: 'application/json',
  });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.getByRole('link', { name: '📝 Pilot list' }).click();
  await page
    .getByRole('textbox', { name: 'New task', exact: true })
    .fill('Offline Svelte task');
  await page
    .getByRole('textbox', { name: 'New task', exact: true })
    .press('Enter');
  await expect(
    page.getByRole('textbox', {
      name: 'Task Offline Svelte task',
      exact: true,
    }),
  ).toHaveValue('Offline Svelte task');
  await page
    .getByRole('button', { name: 'Task details Offline Svelte task' })
    .click();
  await page.getByRole('textbox', { name: 'Description', exact: true }).click();
  await page.getByRole('textbox', { name: 'Description', exact: true }).fill('Durable description');
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole('textbox', {
      name: 'Task Offline Svelte task',
      exact: true,
    }),
  ).toBeVisible();
  expect((await device(page)).tasks[0].description).toBe('Durable description');
  server.loseNextResponse();
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect.poll(() => server.writes()).toBe(1);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect.poll(async () => (await device(page)).queue.length).toBe(0);
  expect(server.writes()).toBe(1);
  expect(server.snapshot.tasks).toHaveLength(1);
  expect(server.snapshot.tasks[0].description).toBe('Durable description');
  await page.getByRole('button', { name: 'completeTask', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Complete Tasks' }),
  ).toBeVisible({ timeout: 5000 });
  await expect(
    page.getByRole('button', { name: 'completeTask', exact: true }),
  ).toBeDisabled();
  await page.screenshot({ path: test.info().outputPath('svelte-tasks.png') });
});

test('pilot endpoints reject unauthenticated and cross-origin writes before contacting MongoDB', async ({
  request,
}) => {
  expect((await request.get('/api/session')).status()).toBe(401);
  expect((await request.get('/api/sync')).status()).toBe(401);
  expect(
    (
      await request.post('/api/sync', {
        headers: { Origin: 'https://other.example' },
        data: {},
      })
    ).status(),
  ).toBe(403);
});

test('Svelte coordinates, list map, black theme, zoom controls and archived read-only data', async ({
  page,
  context,
}) => {
  await transport(context);
  await page.goto('/');
  await page.getByRole('button', { name: 'user-settings-menu' }).click();
  await page.getByRole('switch', { name: 'Dark Mode' }).click();
  await expect
    .poll(() =>
      page.evaluate(() => getComputedStyle(document.body).backgroundColor),
    )
    .toBe('rgb(10, 10, 10)');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    '#171717',
  );
  expect(
    await page.evaluate(() => {
      const key = new KeyboardEvent('keydown', {
        key: '+',
        ctrlKey: true,
        cancelable: true,
      });
      window.dispatchEvent(key);
      const wheel = new WheelEvent('wheel', {
        ctrlKey: true,
        cancelable: true,
      });
      window.dispatchEvent(wheel);
      const scroll = new WheelEvent('wheel', { cancelable: true });
      window.dispatchEvent(scroll);
      return [
        key.defaultPrevented,
        wheel.defaultPrevented,
        scroll.defaultPrevented,
      ];
    }),
  ).toEqual([true, true, false]);
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await page.getByRole('link', { name: '📝 Pilot list' }).click();
  await page
    .getByRole('textbox', { name: 'New task', exact: true })
    .fill('Map task');
  await page
    .getByRole('textbox', { name: 'New task', exact: true })
    .press('Enter');
  await page.getByRole('button', { name: 'Task details Map task' }).click();
  await expect
    .poll(() => page.evaluate(() => document.body.style.position))
    .toBe('fixed');
  await page.getByText('Options', { exact: true }).click();
  await page.getByRole('button', { name: 'Location', exact: true }).click();
  await page.getByRole('tab', { name: 'Latitude / Longitude', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Coordinates', exact: true })
    .fill('-8.0476, -34.8770');
  await page
    .getByRole('button', { name: 'Save location', exact: true })
    .click();
  await expect(
    page.getByRole('link', { name: 'See on Map', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'See on Map', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Map task', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('-8.0476, -34.877', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Locations (1)', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Search locations', exact: true })
    .fill('Map task');
  await page.getByRole('button', { name: 'Map task', exact: true }).click();
  const before = await page
    .locator('.leaflet-tile-container')
    .first()
    .getAttribute('style');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect
    .poll(() =>
      page.locator('.leaflet-tile-container').first().getAttribute('style'),
    )
    .not.toBe(before);
  await page.screenshot({
    path: test.info().outputPath('svelte-map-dark.png'),
  });
  await page.getByRole('link', { name: 'Open task', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await page
    .getByRole('button', { name: 'List settings', exact: true })
    .click();
  await page.getByRole('button', { name: 'Archive list', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(
    page.locator('main').getByText('Archived · Read only', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Add task', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('link', { name: 'Back to lists', exact: true }).click();
  await page.getByRole('button', { name: 'user-settings-menu' }).click();
  await page.getByRole('link', { name: 'Archived Lists', exact: true }).click();
  await expect(page.getByRole('link', { name: '📝 Pilot list' })).toBeVisible();
});

test('timeline groups entries newest first and loads settings offline', async ({ page, context }) => {
  const server = await transport(context);
  server.snapshot.lists[0].type = 'timeline';
  const entries = [
    ['Earlier day', '2026-01-01T12:00:00Z'],
    ['Earlier time', '2026-01-02T10:00:00Z'],
    ['Latest entry', '2026-01-02T15:00:00Z'],
  ];
  entries.forEach(([title, createdAt], index) => server.snapshot.tasks.push({
    _id: (index + 100).toString(16).padStart(24, '0'), listId, title, createdAt, type: 'note', complete: false, version: 0,
  }));
  await page.goto(`/timeline?listId=${listId}`);
  await expect(page.locator('main article p')).toHaveText(['Latest entry', 'Earlier time', 'Earlier day']);
  await expect(page.locator('main section')).toHaveCount(2);
  await expect(page.locator('main section').first().locator('article')).toHaveCount(2);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('main article p')).toHaveText(['Latest entry', 'Earlier time', 'Earlier day']);
  await page.getByRole('button', { name: 'List settings', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'List title', exact: true })).toHaveValue('Pilot list');
});

test('timeline, tags, subtasks and cloning preserve their data offline', async ({
  page,
  context,
}) => {
  await transport(context);
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.getByRole('button', { name: 'New List', exact: true }).click();
  await page.getByRole('textbox', { name: 'List name' }).fill('Journal');
  await page
    .getByRole('radio', { name: 'Timeline', exact: true }).check();
  await page.getByRole('button', { name: 'Create list', exact: true }).click();
  await page.getByRole('link', { name: '📝 Journal' }).click();
  await expect(page).toHaveURL(/\/timeline\?/);
  await page
    .getByRole('textbox', { name: 'New entry' })
    .fill('A journal entry');
  await page.getByRole('button', { name: 'Add entry' }).click();
  await expect(page.getByRole('button', { name: /Task details/ })).toHaveCount(
    0,
  );
  await page.getByRole('link', { name: 'Back to lists' }).click();
  await page.getByRole('link', { name: '📝 Pilot list' }).click();
  await page
    .getByRole('textbox', { name: 'New task', exact: true })
    .fill('Task with addons');
  await page
    .getByRole('textbox', { name: 'New task', exact: true })
    .press('Enter');
  await page
    .getByRole('button', { name: 'Task details Task with addons' })
    .click();
  await enableRelatedTasks(page);
  await page.getByRole('textbox', { name: 'New subtask' }).fill('Child');
  await page
    .getByRole('textbox', { name: 'New subtask', exact: true })
    .press('Enter');
  await page
    .getByRole('textbox', { name: 'Subtask Child' })
    .fill('Edited child');
  await page.getByRole('textbox', { name: 'New tag' }).fill('food');
  await page.getByRole('textbox', { name: 'New tag' }).press('Enter');
  await page.getByText('Options', { exact: true }).click();
  await page.getByRole('button', { name: 'Clone Task' }).click();
  await expect(
    page.getByRole('textbox', {
      name: 'Task Task with addons (Clone)',
      exact: true,
    }),
  ).toBeVisible();
  const saved = await device(page);
  const clone = saved.tasks.find(
    (task: any) => task.title === 'Task with addons (Clone)',
  );
  expect(clone.tags).toEqual(['food']);
  expect(
    saved.tasks.find((task: any) => task.parentTaskId === clone._id).title,
  ).toBe('Edited child');
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole('textbox', {
      name: 'Task Task with addons (Clone)',
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Task details Task with addons (Clone)' })
    .click();
  await page.getByRole('button', { name: 'Remove tag food' }).click();
  await expect(
    page.getByRole('textbox', { name: 'Subtask Edited child' }),
  ).toBeVisible();
});

test('list and task reordering persists, and task batches reveal on scroll', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  server.snapshot.lists.push({
    ...server.snapshot.lists[0],
    _id: '64b2f7a9c1e6f9a1b2c3d4f5',
    title: 'Second list',
    index: 1,
  });
  for (let index = 0; index < 45; index++)
    server.snapshot.tasks.push({
      _id: (index + 100).toString(16).padStart(24, '0'),
      title: `Batch ${index}`,
      listId,
      createdAt: '2026-01-01',
      description: '',
      complete: false,
      index,
      version: 0,
    });
  await page.goto('/');
  await page.getByRole('button', { name: 'Reorder Second list' }).focus();
  await page.keyboard.press('ArrowUp');
  await expect
    .poll(
      async () =>
        (await device(page)).lists.find(
          (list: any) => list.title === 'Second list',
        ).index,
    )
    .toBe(0);
  await page.getByRole('link', { name: '📝 Pilot list' }).click();
  await page
    .getByRole('button', { name: 'Reorder Batch 1', exact: true })
    .focus();
  await page.keyboard.press('ArrowUp');
  await expect
    .poll(
      async () =>
        (await device(page)).tasks.find((task: any) => task.title === 'Batch 1')
          .index,
    )
    .toBe(0);
  await page
    .getByRole('button', { name: 'More tasks' })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole('textbox', { name: 'Task Batch 30', exact: true }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole('textbox', { name: 'Task Batch 1', exact: true }),
  ).toBeVisible();
});

test('classic installed worker upgrades to Svelte without losing pending device edits', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    await navigator.serviceWorker.register('/api/e2e/legacy-worker', {
      scope: '/',
    });
  });
  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.controller?.scriptURL),
    )
    .toContain('/api/e2e/legacy-worker');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Legacy maitu' }),
  ).toBeVisible();
  const oldTab = await context.newPage();
  await oldTab.goto('/');
  await context.setOffline(true);
  await page.evaluate(async (user) => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const req = indexedDB.open('maitu-offline');
      req.onsuccess = () => resolve(req.result);
    });
    const tx = db.transaction('accounts', 'readwrite'),
      store = tx.objectStore('accounts');
    const req = store.get(`user:${user._id}`);
    req.onsuccess = () => {
      const account = req.result;
      const id = '64b2f7a9c1e6f9a1b2c3d4ee';
      const data = {
        _id: id,
        title: 'Pending before upgrade',
        description: 'Keep this',
        complete: false,
        listId: '64b2f7a9c1e6f9a1b2c3d4e5',
        createdAt: '2026-01-01',
        version: 1,
      };
      account.tasks.push(data);
      account.queue.push({
        id: crypto.randomUUID(),
        kind: 'tasks',
        entityId: id,
        action: 'create',
        baseVersion: 0,
        data,
      });
      store.put(account, `user:${user._id}`);
    };
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, user);
  await context.setOffline(false);
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  });
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          !!(await navigator.serviceWorker.getRegistration())?.waiting,
      ),
    )
    .toBe(true);
  await page.getByRole('button', { name: 'Update app' }).click();
  await expect(page.getByRole('link', { name: '📝 Pilot list' })).toBeVisible();
  await page.getByRole('link', { name: '📝 Pilot list' }).click();
  await expect(
    page.getByRole('textbox', {
      name: 'Task Pending before upgrade',
      exact: true,
    }),
  ).toBeVisible();
  await expect.poll(async () => (await device(page)).queue.length).toBe(0);
  expect(server.writes()).toBe(1);
  expect(server.snapshot.tasks[0].description).toBe('Keep this');
  expect(
    await page.evaluate(async () =>
      (await caches.keys()).includes('maitu-shell-legacy-upgrade'),
    ),
  ).toBe(true);
  await oldTab.close();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect
    .poll(() =>
      page.evaluate(async () =>
        (await caches.keys()).includes('maitu-shell-legacy-upgrade'),
      ),
    )
    .toBe(false);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole('textbox', {
      name: 'Task Pending before upgrade',
      exact: true,
    }),
  ).toBeVisible();
});

test('conflicts require a choice, while offline startup renders cached data before slow session requests', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  server.snapshot.tasks.push({
    _id: '64b2f7a9c1e6f9a1b2c3d4e6',
    title: 'Original',
    description: '',
    complete: false,
    listId,
    version: 0,
    createdAt: '2026-01-01',
  });
  await page.goto('/tasks?listId=' + listId);
  await expect(
    page.getByRole('textbox', { name: 'Task Original', exact: true }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page
    .getByRole('textbox', { name: 'Task Original', exact: true })
    .fill('My edit');
  server.snapshot.tasks[0].title = 'Other device';
  server.snapshot.tasks[0].version = 1;
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(
    page.getByRole('heading', { name: 'A change needs your attention' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Keep my change' }).click();
  await expect.poll(() => server.snapshot.tasks[0].title).toBe('My edit');
  await expect.poll(async () => (await device(page)).queue.length).toBe(0);
  await context.route('**/api/session', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await route.fulfill({ json: { user } });
  });
  await page.reload();
  await expect(
    page.getByRole('textbox', { name: 'Task My edit', exact: true }),
  ).toBeVisible({ timeout: 1500 });
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole('textbox', { name: 'Task My edit', exact: true }),
  ).toBeVisible();
});

test('offline logout locks the cached account without deleting its pending edits', async ({
  page,
  context,
}) => {
  await transport(context);
  await page.goto('/tasks?listId=' + listId);
  await page
    .getByRole('textbox', { name: 'New task', exact: true })
    .fill('Keep after logout');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page
    .getByRole('textbox', { name: 'New task', exact: true })
    .press('Enter');
  await page.getByRole('link', { name: 'Back to lists' }).click();
  await page.getByRole('button', { name: 'user-settings-menu' }).click();
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  const saved = await device(page);
  expect(
    saved.tasks.find((task: any) => task.title === 'Keep after logout'),
  ).toBeTruthy();
  expect(saved.queue.length).toBeGreaterThan(0);
  await page.goto('/');
  await expect(page.getByRole('link', { name: '📝 Pilot list' })).toHaveCount(
    0,
  );
});

test('todo keyboard creation, clear-on-blur deletion, floating drag and bottom sheet parity', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const server = await transport(context);
  await page.goto('/tasks?listId=' + listId);
  const input = page.getByRole('textbox', { name: 'New task', exact: true });
  await input.fill('Keyboard task');
  await input.press('Enter');
  await expect(input).toBeFocused();
  await input.fill('Second task');
  await input.press('Enter');
  const handle = page.locator('[data-sort-id]').filter({
    has: page.getByRole('textbox', {
      name: 'Task Keyboard task',
      exact: true,
    }),
  });
  expect(
    await handle.evaluate((row) => {
      const circle = row.querySelector('.todo-check')!.getBoundingClientRect();
      const input = row.querySelector('textarea')!;
      const rect = input.getBoundingClientRect();
      const style = getComputedStyle(input);
      return Math.abs(
        circle.top +
          circle.height / 2 -
          (rect.top +
            parseFloat(style.paddingTop) +
            parseFloat(style.lineHeight) / 2),
      );
    }),
  ).toBeLessThan(1);
  const rect = await handle.boundingBox();
  await page.mouse.move(rect!.x + 5, rect!.y + 5);
  await page.mouse.down();
  await expect(page.locator('[data-sort-ghost]')).toHaveCount(1);
  await page.mouse.move(rect!.x + 5, rect!.y + 60);
  await expect(page.locator('[data-sort-ghost]')).toHaveCount(1);
  await page.mouse.up();
  await expect(page.locator('[data-sort-ghost]')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Task details Keyboard task' })
    .click();
  await expect(page.getByRole('dialog')).toHaveAttribute(
    'data-direction',
    'bottom',
  );
  await expect
    .poll(() => page.evaluate(() => document.body.style.position))
    .toBe('fixed');
  await expect
    .poll(() =>
      page
        .getByRole('dialog')
        .evaluate((node) => Math.round(node.getBoundingClientRect().top)),
    )
    .toBe(40);
  await page.screenshot({
    path: test.info().outputPath('task-sheet-mobile.png'),
  });
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const todo = page.getByRole('textbox', {
    name: 'Task Keyboard task',
    exact: true,
  });
  await todo.fill('');
  await input.focus();
  await expect(todo).toHaveCount(0);
  await expect
    .poll(
      () =>
        server.snapshot.tasks.find(
          (task) => task.title === '' || task.title === 'Keyboard task',
        )?.deleted,
    )
    .toBe(true);
});

test('completed tasks are locked, counted, newest first and reveal every batch on scroll', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  for (let index = 0; index < 55; index++)
    server.snapshot.tasks.push({
      _id: (index + 200).toString(16).padStart(24, '0'),
      title: `Completed ${index}`,
      description: '',
      listId,
      complete: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      completedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
      version: 0,
    });
  await page.goto('/tasks?listId=' + listId);
  await expect(page.getByLabel('Total completed tasks')).toHaveText('55');
  await expect(
    page.getByRole('button', { name: 'More completed tasks', exact: true }),
  ).toHaveCount(0);
  const rows = page.getByRole('textbox', { name: /^Task Completed/ });
  await expect(rows.first()).toHaveValue('Completed 54');
  await expect(
    page.getByRole('button', { name: 'completeTask', exact: true }).first(),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Task details Completed 54', exact: true })
    .click();
  await expect(
    page.getByText('Created', { exact: false }).first(),
  ).toBeVisible();
  await expect(page.getByRole('dialog').locator('time')).toHaveCount(2);
  await page.getByText('Options', { exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Move to undone' }),
  ).toHaveCount(0);
  await page.screenshot({
    path: test.info().outputPath('task-details-updated.png'),
  });
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  for (let attempt = 0; attempt < 5; attempt++) {
    await rows.last().scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(150);
  }
  await expect(rows).toHaveCount(55);
  await expect(rows.last()).toHaveValue('Completed 0');
});


test('mixed lists keep related tasks inside notes through archive, restore and offline reload', async ({ page, context }) => {
  const server = await transport(context);
  await page.goto('/');
  await page.getByRole('button', { name: 'New List', exact: true }).click();
  await page.getByRole('textbox', { name: 'List name' }).fill('Diário');
  await page.getByRole('radio', { name: 'Tasks & Notes', exact: true }).check();
  await page.getByRole('button', { name: 'Create list', exact: true }).click();
  await page.getByRole('link', { name: '📝 Diário' }).click();
  await expect(page.getByRole('tab', { name: 'Tasks', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Notes', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'New note', exact: true });
  await expect(input).toHaveAttribute('placeholder', 'Add note…');
  await input.fill('Searching for a Home');
  await input.press('Enter');
  await page.getByRole('button', { name: 'Open note Searching for a Home', exact: true }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByText('Open', { exact: true })).toHaveCount(0);
  await sheet.getByRole('textbox', { name: 'Description' }).click();
  await pasteDescription(page, '# Our priorities\n- Quiet street\n- Natural light\n\n# Things to investigate\nCompare building fees.');
  await sheet.getByRole('textbox', { name: 'New tag', exact: true }).click();
  await expect(sheet.locator('.markdown-editor h1').first()).toHaveText('Our priorities');
  await sheet.getByRole('textbox', { name: 'New tag', exact: true }).fill('home search');
  await sheet.getByRole('textbox', { name: 'New tag', exact: true }).press('Enter');
  await enableRelatedTasks(page);
  await sheet.getByRole('textbox', { name: 'New subtask', exact: true }).fill('Contact the agent');
  await sheet.getByRole('textbox', { name: 'New subtask', exact: true }).press('Enter');
  await expect(sheet.getByRole('textbox', { name: 'Subtask Contact the agent', exact: true })).toBeVisible();
  await expect(sheet.locator('.entry-tags').getByRole('button', { name: 'Entry actions' })).toHaveCount(0);
  await page.screenshot({ path: '/tmp/maitu-note-detail.png' });
  await sheet.getByRole('button', { name: 'Close panel' }).click();
  await page.getByRole('tab', { name: 'Tasks', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Task Contact the agent', exact: true })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Task Searching for a Home', exact: true })).toHaveCount(0);
  await page.screenshot({ path: '/tmp/maitu-related-tasks.png' });
  await page.getByRole('tab', { name: 'Notes', exact: true }).click();
  await page.getByRole('button', { name: 'Open note Searching for a Home', exact: true }).click();
  await sheet.getByText('Options', { exact: true }).click();
  await sheet.getByRole('button', { name: 'Archive note', exact: true }).click();
  await expect(sheet).not.toBeVisible();
  await page.getByRole('tab', { name: 'Tasks', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Task Contact the agent', exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Notes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open note Searching for a Home', exact: true })).toHaveCount(0);
  await expect(page.locator('summary').filter({ hasText: 'Archived Items' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Archived Items', exact: true }).click();
  await page.getByRole('button', { name: 'Open archived note Searching for a Home', exact: true }).click();
  await expect(sheet.getByRole('textbox', { name: 'Subtask Contact the agent', exact: true })).toBeVisible();
  await sheet.getByText('Options', { exact: true }).click();
  await sheet.getByRole('button', { name: 'Restore note', exact: true }).click();
  await page.getByRole('link', { name: 'Back to list', exact: true }).click();
  await page.getByRole('tab', { name: 'Notes', exact: true }).click();
  await page.getByRole('button', { name: 'Open note Searching for a Home', exact: true }).click();
  await sheet.getByText('Options', { exact: true }).click();
  await sheet.getByRole('button', { name: 'Convert to task', exact: true }).click();
  await expect(sheet.getByText('Open', { exact: true })).toBeVisible();
  await sheet.getByRole('button', { name: 'Convert to note', exact: true }).click();
  await sheet.getByRole('button', { name: 'Close panel' }).click();
  await page.getByRole('tab', { name: 'Tasks', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Task Contact the agent', exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Notes', exact: true }).click();
  await page.getByRole('button', { name: 'Open note Searching for a Home', exact: true }).click();
  await sheet.getByRole('button', { name: 'Complete subtask Contact the agent', exact: true }).click();
  await expect(sheet.getByRole('button', { name: 'Uncomplete subtask Contact the agent' })).toHaveAttribute('aria-pressed', 'true');
  await sheet.getByRole('button', { name: 'Close panel' }).click();
  await expect.poll(async () => (await device(page)).queue.length).toBe(0);
  await expect.poll(() => server.snapshot.tasks.find((task) => task.title === 'Searching for a Home')?.type).toBe('note');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Task Contact the agent', exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Notes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open note Searching for a Home', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open note Searching for a Home', exact: true }).click();
  await expect(sheet.getByRole('button', { name: 'Uncomplete subtask Contact the agent' })).toHaveAttribute('aria-pressed', 'true');
});


test('existing task lists can enable Tasks & Notes without losing entries', async ({ page, context }) => {
  const server = await transport(context);
  server.snapshot.tasks.push({ _id: '64b2f7a9c1e6f9a1b2c3d4e9', listId, title: 'Existing', description: 'Keep my notes', complete: false, createdAt: '2026-01-01', version: 0 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/tasks?listId=${listId}`);
  await page.getByRole('button', { name: 'List settings', exact: true }).click();
  await page.getByRole('radio', { name: 'Tasks & Notes', exact: true }).check();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Tasks', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Task details Existing', exact: true }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('textbox', { name: 'Description' })).toHaveText('Keep my notes');
  await sheet.getByText('Options', { exact: true }).click();
  await sheet.getByRole('button', { name: 'Convert to note', exact: true }).click();
  await expect(sheet.getByRole('textbox', { name: 'Description' })).toHaveText('Keep my notes');
  await expect(sheet.getByRole('button', { name: 'Convert to task', exact: true })).toBeVisible();
  await page.screenshot({ path: '/tmp/maitu-note-mobile.png' });
  await sheet.getByRole('button', { name: 'Close panel' }).click();
  await expect(sheet).not.toBeVisible();
  await page.getByRole('tab', { name: 'Notes', exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Tasks', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('button', { name: 'Open note Existing', exact: true })).toHaveCount(0);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Open note Existing', exact: true })).toBeVisible();
  await expect.poll(async () => (await device(page)).queue.length).toBe(0);
  expect(server.snapshot.tasks.find((task) => task.title === 'Existing').description).toBe('Keep my notes');
});

test('item details scroll together, edit bold and bullet lists live and open archived notes on their page', async ({ page, context }) => {
  const server = await transport(context);
  server.snapshot.lists[0].type = 'mixed';
  const parent = '64b2f7a9c1e6f9a1b2c3d4ef';
  server.snapshot.tasks.push({ _id: parent, listId, title: 'A task with a long title that wraps naturally on mobile', description: '', complete: false, createdAt: '2026-01-01', version: 0, addons: ['location'], location: { name: 'Home', address: 'Recife', latitude: -8, longitude: -34, source: 'manual', placeId: 'manual' } });
  for (let index = 0; index < 35; index++) {
    server.snapshot.tasks.push({ _id: (index + 200).toString(16).padStart(24, '0'), listId, title: `Related ${index}`, parentTaskId: parent, complete: false, createdAt: '2026-01-01', version: 0 });
    server.snapshot.tasks.push({ _id: (index + 300).toString(16).padStart(24, '0'), listId, type: 'note', archived: true, title: index === 34 ? 'Archived 34 ' + 'A long note title '.repeat(20) : `Archived ${index}`, description: '', complete: false, createdAt: '2026-01-01', version: 0 });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/tasks?listId=${listId}`);
  await expect(page.getByRole('textbox', { name: 'New task', exact: true })).toHaveAttribute('placeholder', 'Add task…');
  await expect(page.locator('summary').filter({ hasText: 'Archived Items' })).toHaveCount(1);
  await page.getByRole('tab', { name: 'Notes', exact: true }).click();
  await expect(page.locator('summary').filter({ hasText: 'Archived Items' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Archived Items', exact: true }).click();
  const archive = page.getByRole('region', { name: 'Pilot list archive', exact: true });
  await expect(archive.getByRole('button')).toHaveCount(35);
  await expect(archive.getByRole('button', { name: /^Open archived note Archived 34 / })).toBeVisible();
  const archivedIcon = await archive.getByRole('button', { name: /^Open archived note Archived 34 / }).locator('svg').boundingBox();
  expect(archivedIcon!.width).toBe(24);
  await archive.getByRole('button', { name: /^Open archived note Archived 34 / }).click();
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('link', { name: 'Back to list', exact: true }).click();
  await page.getByRole('button', { name: 'Task details A task with a long title that wraps naturally on mobile', exact: true }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.locator('.entry-kind-line')).toHaveCount(0);
  await expect(sheet.getByRole('heading', { name: 'Related Tasks', exact: true })).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Edit note', exact: true })).toHaveCount(0);
  const close = await sheet.getByRole('button', { name: 'Close panel', exact: true }).boundingBox();
  const panel = await sheet.boundingBox();
  expect(close!.x + close!.width).toBeLessThanOrEqual(panel!.x + panel!.width - 14);
  expect(close!.y).toBeGreaterThanOrEqual(panel!.y + 14);
  await expect(page.getByRole('tab')).toHaveCount(2);
  await expect(page.getByRole('tab', { name: 'All', exact: true })).toHaveCount(0);
  const description = sheet.getByRole('textbox', { name: 'Description', exact: true });
  await pasteDescription(page, '# Priorities\n\n**Quiet street** and *natural light*.\n\n- Room to work\n\nhttps://example.com/a/very/long/property/listing?ref=research\n\n[Safe link](https://example.com)\n\n<img src="x" onerror="window.markdownExecuted=true"><a href="javascript:window.markdownExecuted=true">Unsafe link</a>');
  await expect(description).toBeFocused();
  await expect(sheet.locator('.markdown-editor textarea')).toHaveCount(0);
  await expect(description.locator('strong')).toHaveText('Quiet street');
  await expect(description.locator('em')).toHaveText('natural light');
  await expect(description.locator('ul li')).toHaveText('Room to work');
  const chip = description.getByRole('link', { name: 'example.com', exact: true });
  await expect(chip).toHaveAttribute('href', 'https://example.com/a/very/long/property/listing?ref=research');
  await expect(chip).toHaveAttribute('target', '_blank');
  await expect(chip).toHaveAttribute('rel', 'noopener noreferrer');
  await page.screenshot({ path: '/tmp/maitu-live-editor.png' });
  await context.route('https://example.com/**', (route) => route.fulfill({ body: '<p>Destination</p>', contentType: 'text/html' }));
  const popupPromise = page.waitForEvent('popup');
  await chip.click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL('https://example.com/a/very/long/property/listing?ref=research');
  await popup.close();
  await expect(description.locator('script, [onerror], [href^="javascript:"]')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).markdownExecuted)).toBeUndefined();
  await description.fill('');
  // Clearing a heading retains its block type; start a paragraph before testing the list shortcut.
  await description.press('ControlOrMeta+Alt+0');
  await description.pressSequentially('- ');
  await expect(description.locator('ul')).toHaveCount(1);
  await description.press('ControlOrMeta+B');
  await description.pressSequentially('New priorities');
  await expect(description.locator('ul li strong')).toHaveText('New priorities');
  await description.press('ArrowRight');
  await description.press('End');
  await description.press('Enter');
  await description.pressSequentially('Another priority');
  await expect(description.locator('ul li')).toHaveCount(2);
  await expect(description.locator('ul li').nth(1)).toHaveText('Another priority');
  await description.press('Enter');
  await description.press('Enter');
  await description.pressSequentially('A closing paragraph');
  await expect(description.locator('ul li')).toHaveCount(2);
  await expect(description.locator('p').last()).toHaveText('A closing paragraph');
  await expect(sheet.getByRole('button', { name: 'Bold', exact: true })).toHaveCount(0);
  await expect(sheet.getByRole('button', { name: 'Bullet list', exact: true })).toHaveCount(0);
  await sheet.getByRole('textbox', { name: 'New tag', exact: true }).click();
  await expect(description.locator('ul')).toBeVisible();
  await expect.poll(async () => (await device(page)).tasks.find((task: any) => task._id === parent).description).toContain('**New priorities**');
  const headerBefore = await sheet.locator('.drawer-header').boundingBox();
  await sheet.locator('.detail-scroll').evaluate((node) => node.scrollTop += 400);
  const headerAfter = await sheet.locator('.drawer-header').boundingBox();
  expect(headerAfter!.y).toBeLessThan(headerBefore!.y - 300);
  await sheet.getByRole('heading', { name: 'Location', exact: true }).scrollIntoViewIfNeeded();
  const headingStyle = await sheet.getByRole('heading', { name: 'Location', exact: true }).evaluate((node) => ({ fontSize: getComputedStyle(node).fontSize, fontWeight: getComputedStyle(node).fontWeight }));
  expect(await sheet.getByRole('heading', { name: 'Related Tasks', exact: true }).evaluate((node) => ({ fontSize: getComputedStyle(node).fontSize, fontWeight: getComputedStyle(node).fontWeight }))).toEqual(headingStyle);
  await sheet.getByText('Options', { exact: true }).click();
  await expect(sheet.getByRole('button', { name: 'Clone Task', exact: true })).toBeVisible();
  await sheet.locator('.detail-scroll').evaluate((node) => node.scrollTop = 0);
  expect(await sheet.locator('.drawer-body').evaluate((node) => parseFloat(getComputedStyle(node).paddingBottom))).toBeGreaterThanOrEqual(112);
  await page.screenshot({ path: '/tmp/maitu-improved-detail.png' });
  await sheet.getByRole('button', { name: 'Close panel', exact: true }).click();
  await expect(sheet).not.toBeVisible();
  await page.getByRole('tab', { name: 'Tasks', exact: true }).click();
  await page.getByRole('button', { name: 'Task details A task with a long title that wraps naturally on mobile', exact: true }).click();
  await expect(sheet.getByRole('textbox', { name: 'Description', exact: true }).locator('ul li strong').first()).toHaveText('New priorities');
  await expect(sheet.getByRole('textbox', { name: 'Description', exact: true }).locator('ul li')).toHaveCount(2);

});

test('a newly added Related Tasks add-on can be removed immediately', async ({ page, context }) => {
  await transport(context);
  await page.goto(`/tasks?listId=${listId}`);
  await page.getByRole('textbox', { name: 'New task', exact: true }).fill('Remove new add-on');
  await page.getByRole('textbox', { name: 'New task', exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Task details Remove new add-on', exact: true }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByText('Options', { exact: true }).click();
  await sheet.getByRole('button', { name: 'Related Tasks', exact: true }).click();
  await sheet.getByLabel('Related Tasks options', { exact: true }).click();
  await sheet.getByRole('button', { name: 'Remove Related Tasks', exact: true }).click();
  await expect(sheet.getByRole('heading', { name: 'Related Tasks', exact: true })).toHaveCount(0);
  await expect.poll(async () => (await device(page)).tasks.find((task: any) => task.title === 'Remove new add-on').addons).toEqual([]);
});

test('Related Tasks is optional, protects its children and preserves Location independently', async ({ page, context }) => {
  await transport(context);
  await page.goto(`/tasks?listId=${listId}`);
  await page.getByRole('textbox', { name: 'New task', exact: true }).fill('Optional add-ons');
  await page.getByRole('textbox', { name: 'New task', exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Task details Optional add-ons', exact: true }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('heading', { name: 'Related Tasks', exact: true })).toHaveCount(0);
  await enableRelatedTasks(page);
  await sheet.getByLabel('Related Tasks options', { exact: true }).click();
  await expect(sheet.getByRole('button', { name: 'Remove Related Tasks', exact: true })).toBeEnabled();
  await sheet.getByRole('textbox', { name: 'New subtask', exact: true }).fill('Child stays');
  await sheet.getByRole('textbox', { name: 'New subtask', exact: true }).press('Enter');
  await sheet.getByLabel('Related Tasks options', { exact: true }).click();
  await expect(sheet.getByRole('button', { name: 'Remove Related Tasks', exact: true })).toBeDisabled();
  await sheet.getByText('Options', { exact: true }).click();
  const locationButton = sheet.getByRole('button', { name: 'Location', exact: true });
  expect(await locationButton.evaluate((node) => parseFloat(getComputedStyle(node).paddingLeft))).toBeGreaterThan(0);
  await locationButton.click();
  await sheet.getByRole('tab', { name: 'Latitude / Longitude', exact: true }).click();
  await sheet.getByRole('textbox', { name: 'Coordinates', exact: true }).fill('-8, -34');
  await sheet.getByRole('button', { name: 'Save location', exact: true }).click();
  await expect.poll(async () => (await device(page)).tasks.find((task: any) => task.title === 'Optional add-ons').addons).toEqual(['relatedTasks', 'location']);
  await sheet.getByLabel('Location options', { exact: true }).click();
  await sheet.getByRole('button', { name: 'Remove location', exact: true }).click();
  await expect(sheet.getByRole('heading', { name: 'Location', exact: true })).toHaveCount(0);
  await expect(sheet.getByRole('textbox', { name: 'Subtask Child stays', exact: true })).toBeVisible();
  await expect.poll(async () => (await device(page)).tasks.find((task: any) => task.title === 'Optional add-ons').addons).toEqual(['relatedTasks']);
  await sheet.getByRole('button', { name: 'Location', exact: true }).click();
  await sheet.getByRole('textbox', { name: 'Subtask Child stays', exact: true }).fill('');
  await sheet.getByRole('textbox', { name: 'Subtask Child stays', exact: true }).press('Tab');
  await sheet.getByLabel('Related Tasks options', { exact: true }).click();
  await expect(sheet.getByRole('button', { name: 'Remove Related Tasks', exact: true })).toBeEnabled();
  await sheet.getByRole('button', { name: 'Remove Related Tasks', exact: true }).click();
  await expect(sheet.getByRole('heading', { name: 'Related Tasks', exact: true })).toHaveCount(0);
  await expect(sheet.getByRole('heading', { name: 'Location', exact: true })).toBeVisible();
  await expect.poll(async () => (await device(page)).tasks.find((task: any) => task.title === 'Optional add-ons').addons).toEqual(['location']);
});

test.describe('lazy editor loading', () => {
  test.use({ serviceWorkers: 'block' });
test('the detail sheet renders while the rich editor download is delayed', async ({ page, context }) => {
  const server = await transport(context);
  server.snapshot.tasks.push({ _id: '64b2f7a9c1e6f9a1b2c3d4ee', listId, title: 'Fast details', description: '', complete: false, createdAt: '2026-01-01', version: 0 });
  const manifest = JSON.parse(readFileSync('.svelte-kit/output/client/.vite/manifest.json', 'utf8'));
  const editorFile = manifest['src/lib/ui/RichTextEditor.svelte'].file;
  let release!: () => void;
  let requested!: () => void;
  const waitForRelease = new Promise<void>((resolve) => release = resolve);
  const waitForRequest = new Promise<void>((resolve) => requested = resolve);
  await page.route(`**/${editorFile}`, async (route) => {
    requested();
    await waitForRelease;
    await route.continue();
  });
  try {
    await page.goto(`/tasks?listId=${listId}`);
    await page.getByRole('button', { name: 'Task details Fast details', exact: true }).click();
    await waitForRequest;
    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('textbox', { name: 'Task title', exact: true })).toHaveValue('Fast details');
    await expect(sheet.getByRole('textbox', { name: 'New tag', exact: true })).toBeVisible();
    await expect(sheet.getByText('Options', { exact: true })).toBeVisible();
    await expect(sheet.getByRole('textbox', { name: 'Description', exact: true })).toHaveCount(0);
  } finally {
    release();
  }
  await expect(page.getByRole('textbox', { name: 'Description', exact: true })).toBeVisible();
});

});

for (const type of ['tasks', 'mixed', 'notes', 'timeline']) {
  test(`${type} items archive and restore through Options`, async ({ page, context }) => {
    const server = await transport(context);
    server.snapshot.lists[0].type = type;
    const id = '64b2f7a9c1e6f9a1b2c3d4ef';
    server.snapshot.tasks.push({ _id: id, listId, title: 'Archive this item', description: '', complete: false, createdAt: '2026-01-01', version: 0 });
    if (type === 'mixed') server.snapshot.tasks.push({ _id: '64b2f7a9c1e6f9a1b2c3d4ee', listId, title: 'Already archived note', type: 'note', archived: true, complete: false, createdAt: '2026-01-01', version: 0 });
    await page.goto(`/${type === 'timeline' ? 'timeline' : 'tasks'}?listId=${listId}`);
    await page.getByRole('button', { name: `${['notes', 'timeline'].includes(type) ? 'Note' : 'Task'} details Archive this item`, exact: true }).click();
    const sheet = page.getByRole('dialog');
    await sheet.getByText('Options', { exact: true }).click();
    await sheet.getByRole('button', { name: ['notes', 'timeline'].includes(type) ? 'Archive note' : 'Archive task', exact: true }).click();
    await expect(sheet).not.toBeVisible();
    await expect(page.getByRole('button', { name: /^(Task|Note) details Archive this item$/ })).toHaveCount(0);
    if (type === 'notes') await expect(page.locator('summary').filter({ hasText: 'Archived Items' })).toHaveCount(0);
    if (type === 'mixed') {
      await page.getByRole('tab', { name: 'Notes', exact: true }).click();
      await expect(page.locator('summary').filter({ hasText: 'Archived Items' })).toHaveCount(0);
    }
    await page.getByRole('link', { name: 'Archived Items', exact: true }).click();
    if (type === 'mixed') await expect(page.getByRole('button', { name: 'Open archived note Already archived note' })).toBeVisible();
    await page.getByRole('button', { name: /Open archived .* Archive this item/ }).click();
    await sheet.getByText('Options', { exact: true }).click();
    await sheet.getByRole('button', { name: ['notes', 'timeline'].includes(type) ? 'Restore note' : 'Restore task', exact: true }).click();
    await expect(page.getByRole('button', { name: /Open archived .* Archive this item/ })).toHaveCount(0);
    await page.getByRole('link', { name: 'Back to list', exact: true }).click();
    await expect(page.getByRole('button', { name: /^(Task|Note) details Archive this item$/ })).toBeVisible();
    await expect.poll(async () => (await device(page)).queue.length).toBe(0);
  });
}

test('related tasks archive independently and restore to their parent', async ({ page, context }) => {
  const server = await transport(context);
  const parent = '64b2f7a9c1e6f9a1b2c3d4ef';
  const child = '64b2f7a9c1e6f9a1b2c3d4ee';
  server.snapshot.tasks.push({ _id: parent, listId, title: 'Parent', description: 'Parent contents', complete: false, createdAt: '2026-01-01', version: 0 });
  server.snapshot.tasks.push({ _id: child, listId, parentTaskId: parent, title: 'Child', description: 'Child contents', complete: true, createdAt: '2026-01-01', version: 0 });
  await page.goto(`/tasks?listId=${listId}`);
  await page.getByRole('button', { name: 'Task details Parent', exact: true }).click();
  let sheet = page.getByRole('dialog');
  await sheet.getByRole('button', { name: 'Task details Child', exact: true }).click();
  await expect(sheet.getByRole('heading', { name: 'Child', exact: true })).toBeVisible();
  await expect(sheet.locator('.markdown-editor')).toContainText('Child contents');
  await sheet.getByText('Options', { exact: true }).click();
  await sheet.getByRole('button', { name: 'Archive task', exact: true }).click();
  await page.getByRole('button', { name: 'Task details Parent', exact: true }).click();
  await expect(sheet.getByRole('textbox', { name: 'Subtask Child', exact: true })).toHaveCount(0);
  await sheet.getByRole('button', { name: 'Close panel' }).click();
  await page.getByText('Archived Items', { exact: true }).click();
  await page.getByRole('button', { name: 'Open archived task Child', exact: true }).click();
  await sheet.getByText('Options', { exact: true }).click();
  await sheet.getByRole('button', { name: 'Restore task', exact: true }).click();
  await page.getByRole('button', { name: 'Task details Parent', exact: true }).click();
  await expect(sheet.getByRole('textbox', { name: 'Subtask Child', exact: true })).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Uncomplete subtask Child' })).toHaveAttribute('aria-pressed', 'true');
});

for (const type of ['tasks', 'notes']) {
  test(`${type} list conversions protect archived entries and preserve them in mixed lists offline`, async ({ page, context }) => {
    const server = await transport(context);
    server.snapshot.lists[0].type = type;
    server.snapshot.tasks.push({ _id: '64b2f7a9c1e6f9a1b2c3d4ef', listId, title: 'Saved archived entry', archived: true, complete: false, createdAt: '2026-01-01', version: 0 });
    await page.goto(`/tasks?listId=${listId}`);
    await page.getByRole('button', { name: 'List settings', exact: true }).click();
    const select = page.getByRole('group', { name: 'List type', exact: true });
    await expect(select.getByRole('radio')).toHaveCount(5);
    await expect(select.getByRole('radio', { name: 'Timeline', exact: true })).toBeDisabled();
    await expect(page.getByText(/Remove all (notes|tasks) before changing/)).toHaveCount(0);
    await expect(select.getByRole('radio', { name: type === 'tasks' ? 'Notes' : 'Tasks', exact: true })).toBeDisabled();
    await select.getByRole('radio', { name: 'Tasks & Notes', exact: true }).check();
    await page.waitForURL(`**/tasks?listId=${listId}`);
    if (await page.getByRole('dialog').isVisible()) await page.getByRole('button', { name: 'Close panel', exact: true }).click();
    await expect(page.getByRole('tab', { name: 'Notes', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'List settings', exact: true }).click();
    await expect(select.getByRole('radio', { name: type === 'tasks' ? 'Notes' : 'Tasks', exact: true })).toBeDisabled();
    await expect(select.getByRole('radio', { name: type === 'tasks' ? 'Tasks' : 'Notes', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Close panel', exact: true }).click();
    await expect.poll(async () => (await device(page)).queue.length).toBe(0);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await page.getByText('Archived Items', { exact: true }).click();
    await expect(page.getByRole('button', { name: `Open archived ${type === 'notes' ? 'note' : 'task'} Saved archived entry`, exact: true })).toBeVisible();
  });
}

test('empty lists can switch between Tasks and Notes', async ({ page, context }) => {
  await transport(context);
  await page.goto(`/tasks?listId=${listId}`);
  await page.getByRole('button', { name: 'List settings', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Timeline', exact: true })).toBeDisabled();
  await page.getByRole('radio', { name: 'Notes', exact: true }).check();
  await page.waitForURL(`**/tasks?listId=${listId}`);
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await page.getByRole('button', { name: 'List settings', exact: true }).click();
  await page.getByRole('radio', { name: 'Tasks', exact: true }).check();
  await page.waitForURL(`**/tasks?listId=${listId}`);
  await expect(page.getByRole('textbox', { name: 'New task', exact: true })).toBeVisible();
});

test('Notes lists use note rows and details instead of a timeline', async ({ page, context }) => {
  const server = await transport(context);
  server.snapshot.lists[0].type = 'notes';
  server.snapshot.tasks.push({ _id: '64b2f7a9c1e6f9a1b2c3d4ef', listId, title: 'Existing legacy note', complete: false, createdAt: '2026-01-01', version: 0 });
  await page.goto('/');
  await page.getByRole('link', { name: /Pilot list/ }).click();
  await page.waitForURL(`**/tasks?listId=${listId}`);
  await expect(page.getByRole('button', { name: 'Open note Existing legacy note', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'completeTask', exact: true })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Date filter' })).toHaveCount(0);
  await expect(page.getByRole('tab')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'New note', exact: true }).fill('New standalone note');
  await page.getByRole('textbox', { name: 'New note', exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Open note New standalone note', exact: true }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('textbox', { name: 'Description', exact: true })).toBeVisible();
  await expect(sheet.getByText('Open', { exact: true })).toHaveCount(0);
  await sheet.getByText('Options', { exact: true }).click();
  await sheet.getByRole('button', { name: 'Archive note', exact: true }).click();
  await page.getByRole('link', { name: 'Archived Items', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open archived note New standalone note', exact: true })).toBeVisible();
  await page.goto(`/tasks?listId=${listId}`);
  await expect(page.getByRole('button', { name: 'Open note Existing legacy note', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'New note', exact: true })).toHaveAttribute('placeholder', 'Add note…');
});

test('segmented list types create distinct Notes and Timeline lists', async ({ page, context }) => {
  await transport(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'New List', exact: true }).click();
  const sheet = page.getByRole('dialog');
  const types = sheet.getByRole('group', { name: 'List type', exact: true });
  await expect(types.getByRole('radio')).toHaveCount(5);
  const boxes = await types.locator('.type-tile').evaluateAll((tiles) => tiles.map((tile) => tile.getBoundingClientRect().toJSON()));
  expect(new Set(boxes.map((box) => box.y)).size).toBe(1);
  expect(boxes.at(-1)!.right).toBeLessThanOrEqual(390);
  await expect(sheet.locator('.list-options')).toHaveCSS('border-top-width', '1px');
  await sheet.getByRole('button', { name: 'More emojis', exact: true }).click();
  await sheet.getByRole('searchbox', { name: 'Search emojis', exact: true }).fill('Travel');
  await sheet.getByRole('button', { name: 'Travel', exact: true }).click();
  await expect(sheet.locator('.list-avatar')).toHaveText('✈️');
  await sheet.getByRole('button', { name: 'More emojis', exact: true }).click();
  await types.getByRole('radio', { name: 'Notes', exact: true }).check();
  await expect(types.getByRole('radio', { name: 'Notes', exact: true })).toBeChecked();
  await expect(types.locator('.type-tile.selected')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.screenshot({ path: '/tmp/maitu-list-type-tiles.png' });
  const iconRows = await sheet.locator('.list-favorite-icons button').evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().y));
  expect(new Set(iconRows).size).toBe(1);
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await sheet.evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/maitu-new-list-small.png', animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 });
  await sheet.getByRole('textbox', { name: 'List name', exact: true }).fill('Standalone Notes');
  await sheet.getByRole('button', { name: 'Create list', exact: true }).click();
  await page.getByRole('link', { name: /Standalone Notes/ }).click();
  await expect(page.getByRole('textbox', { name: 'New note', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to lists' }).click();
  await page.getByRole('button', { name: 'New List', exact: true }).click();
  await sheet.getByRole('radio', { name: 'Timeline', exact: true }).check();
  await sheet.getByRole('textbox', { name: 'List name', exact: true }).fill('Separate Timeline');
  await sheet.getByRole('button', { name: 'Create list', exact: true }).click();
  await page.getByRole('link', { name: /Separate Timeline/ }).click();
  await expect(page).toHaveURL(/\/timeline\?/);
  await page.getByRole('textbox', { name: 'New entry', exact: true }).fill('Timeline entry');
  await page.getByRole('button', { name: 'Add entry', exact: true }).click();
  await expect(page.locator('article').getByText('Timeline entry', { exact: true })).toBeVisible();
  await expect(page.locator('section h2')).toHaveCount(1);
  await expect(page.locator('article time')).toHaveCount(1);
  await page.getByRole('button', { name: 'List settings', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Timeline', exact: true })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Timeline', exact: true })).toBeDisabled();
  await page.screenshot({ path: '/tmp/maitu-edit-list-styles.png', animations: 'disabled' });
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.screenshot({ path: '/tmp/maitu-edit-list-dark.png', animations: 'disabled' });
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  await page.getByRole('textbox', { name: 'Confirm list name', exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Delete list permanently', exact: true })).toBeDisabled();
  await page.screenshot({ path: '/tmp/maitu-edit-list-delete.png', animations: 'disabled' });
});

test('task add-ons control scheduling and the tag input fills space after tags', async ({ page, context }) => {
  const server = await transport(context);
  const taskId = '64b2f7a9c1e6f9a1b2c3d4ef';
  server.snapshot.tasks.push({ _id: taskId, listId, title: 'Existing schedule', complete: false, createdAt: '2026-01-01', version: 0, tags: ['one', 'two'], schedule: { date: '2026-10-20', timeZone: 'America/Recife' }, reminder: { id: 'old-reminder', at: '2026-10-20T12:00:00Z', timeZone: 'America/Recife' } });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/tasks?listId=${listId}&taskId=${taskId}`);
  const drawer = page.getByRole('dialog');
  await expect(drawer.locator('.scheduling')).toBeVisible();
  await expect(drawer.getByRole('textbox', { name: 'Description', exact: true })).toBeVisible();
  const tag = drawer.getByRole('textbox', { name: 'New tag', exact: true });
  const { inputBox, formBox, lastTagBox, schedulingBox } = await tag.evaluate((input) => ({
    inputBox: input.getBoundingClientRect().toJSON(),
    formBox: input.parentElement!.getBoundingClientRect().toJSON(),
    lastTagBox: Array.from(input.parentElement!.querySelectorAll(':scope > span')).at(-1)!.getBoundingClientRect().toJSON(),
    schedulingBox: input.closest('dialog')!.querySelector('.scheduling')!.getBoundingClientRect().toJSON(),
  }));
  expect(schedulingBox!.y).toBeGreaterThan(formBox!.y + formBox!.height);
  expect(inputBox!.x).toBeGreaterThan(lastTagBox!.x + lastTagBox!.width);
  expect(Math.abs(inputBox!.y + inputBox!.height / 2 - lastTagBox!.y - lastTagBox!.height / 2)).toBeLessThan(2);
  expect(inputBox!.x + inputBox!.width).toBeCloseTo(formBox!.x + formBox!.width, 0);
  await page.screenshot({ path: '/tmp/maitu-inline-tags.png', animations: 'disabled' });
  await expect(drawer.getByRole('alert')).toHaveCount(0);
  await tag.fill('three');
  await tag.press('Enter');
  await expect(drawer.getByRole('button', { name: 'Remove tag three', exact: true })).toBeVisible();
  await drawer.locator('.scheduling summary').click();
  await drawer.getByLabel('Schedule & Reminder options', { exact: true }).click();
  await drawer.getByRole('button', { name: 'Remove Schedule & Reminder', exact: true }).click();
  await expect(drawer.locator('.scheduling')).toHaveCount(0);
  await expect.poll(async () => (await device(page)).tasks.find((task: any) => task._id === taskId)?.reminder).toBeNull();
  expect((await device(page)).tasks.find((task: any) => task._id === taskId)?.schedule).toBeNull();
  await drawer.getByText('Options', { exact: true }).click();
  await drawer.getByRole('button', { name: 'Schedule & Reminder', exact: true }).click();
  await expect(drawer.locator('.scheduling')).toBeVisible();
  await expect.poll(async () => (await device(page)).tasks.find((task: any) => task._id === taskId)?.addons).toContain('scheduling');
  await page.screenshot({ path: '/tmp/maitu-task-addons.png' });
});

test('mixed list tabs use the list color beside the date filter', async ({ page, context }) => {
  const server = await transport(context);
  server.snapshot.lists[0].type = 'mixed';
  server.snapshot.lists[0].color = 'redColor';
  server.snapshot.tasks.push({ _id: '64b2f7a9c1e6f9a1b2c3d4ef', listId, title: 'Previously scheduled', complete: false, wasScheduled: true, createdAt: '2026-01-01', version: 0 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/tasks?listId=${listId}`);
  const tabs = page.getByRole('tablist', { name: 'Entry filter' });
  const filter = page.getByRole('combobox', { name: 'Date filter' });
  await expect(page.getByText('Show', { exact: true })).toHaveCount(0);
  for (const tab of await tabs.getByRole('tab').all()) await expect(tab).toHaveCSS('color', 'rgb(245, 92, 48)');
  const row = page.locator('.list-filters');
  await expect(row).toHaveCSS('border-bottom-width', '1px');
  const rowBox = await row.boundingBox();
  expect(rowBox!.width).toBe(350);
  const tabBox = await tabs.boundingBox();
  const filterBox = await filter.boundingBox();
  expect(Math.abs(tabBox!.y + tabBox!.height / 2 - filterBox!.y - filterBox!.height / 2)).toBeLessThan(2);
  expect(tabBox!.x + tabBox!.width).toBeLessThanOrEqual(filterBox!.x);
  await page.screenshot({ path: '/tmp/maitu-tabs-filter.png' });
  await page.getByRole('tab', { name: 'Notes', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Notes', exact: true })).toHaveCSS('border-bottom-color', 'rgb(245, 92, 48)');
  await expect(filter).toHaveCount(0);
  await expect(page.locator('.task-creation .scheduling')).toHaveCount(0);
});

test('the date filter appears after scheduling and stays after removing scheduling', async ({ page, context }) => {
  await transport(context);
  await page.goto(`/tasks?listId=${listId}`);
  const filter = page.getByRole('combobox', { name: 'Date filter' });
  await expect(filter).toHaveCount(0);
  await page.getByRole('textbox', { name: 'New task', exact: true }).fill('Schedule history');
  await page.getByRole('textbox', { name: 'New task', exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Task details Schedule history', exact: true }).click();
  const drawer = page.getByRole('dialog');
  await drawer.getByText('Options', { exact: true }).click();
  await drawer.getByRole('button', { name: 'Schedule & Reminder', exact: true }).click();
  await expect(filter).toHaveCount(0);
  await drawer.locator('.scheduling summary').click();
  await drawer.getByLabel('Scheduled date', { exact: true }).fill('2026-10-20');
  await drawer.getByRole('button', { name: 'Save date', exact: true }).click();
  await expect(filter).toHaveCount(1);
  await drawer.getByLabel('Schedule & Reminder options', { exact: true }).click();
  await drawer.getByRole('button', { name: 'Remove Schedule & Reminder', exact: true }).click();
  await expect(drawer.locator('.scheduling')).toHaveCount(0);
  await drawer.getByRole('button', { name: 'Close panel', exact: true }).click();
  await expect(filter).toBeVisible();
  await expect.poll(async () => (await device(page)).queue.length).toBe(0);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(filter).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Task Schedule history', exact: true })).toBeVisible();
});

test('dedicated archive groups mixed tasks and notes and supports restore offline', async ({ page, context }) => {
  const server = await transport(context);
  server.snapshot.lists[0].type = 'mixed';
  const otherList = '64b2f7a9c1e6f9a1b2c3d4e7';
  server.snapshot.lists.push({ ...server.snapshot.lists[0], _id: otherList, title: 'Other list', type: 'tasks' });
  server.snapshot.tasks.push(
    { _id: '64b2f7a9c1e6f9a1b2c3d4e8', listId, title: 'Task to archive', complete: false, createdAt: '2026-01-01', version: 0 },
    { _id: '64b2f7a9c1e6f9a1b2c3d4e9', listId, title: 'Archived note', type: 'note', archived: true, complete: false, createdAt: '2026-01-01', version: 0 },
    { _id: '64b2f7a9c1e6f9a1b2c3d4ea', listId: otherList, title: 'Other archived task', archived: true, complete: true, createdAt: '2026-01-01', version: 0 },
  );
  await page.goto(`/tasks?listId=${listId}`);
  await page.getByRole('button', { name: 'Task details Task to archive', exact: true }).click();
  await page.getByRole('dialog').getByText('Options', { exact: true }).click();
  await page.getByRole('button', { name: 'Archive task', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('link', { name: 'Archived Items', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Archived Items', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open archived task Task to archive', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open archived note Archived note', exact: true })).toBeVisible();
  await expect(page.getByText('Other archived task', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Open archived task Task to archive', exact: true }).click();
  await page.getByRole('dialog').getByText('Options', { exact: true }).click();
  await page.getByRole('button', { name: 'Restore task', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open archived task Task to archive', exact: true })).toHaveCount(0);
  await page.goto('/');
  await page.getByRole('button', { name: 'user-settings-menu' }).click();
  await page.getByRole('link', { name: 'Archived Items', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open archived note Archived note', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open archived task Other archived task', exact: true })).toBeVisible();
  await expect.poll(async () => (await device(page)).queue.length).toBe(0);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Open archived note Archived note', exact: true })).toBeVisible();
  await page.screenshot({ path: '/tmp/maitu-archive-page.png' });
});

test('all add-ons share a top-right options menu without colliding with the scheduling toggle', async ({ page, context }) => {
  const server = await transport(context);
  const id = '64b2f7a9c1e6f9a1b2c3d4ef';
  server.snapshot.tasks.push({ _id: id, listId, title: 'All add-ons', description: '', complete: false, createdAt: '2026-01-01', version: 0, addons: ['scheduling', 'location', 'relatedTasks'] });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/tasks?listId=${listId}&taskId=${id}`);
  const drawer = page.getByRole('dialog');
  await expect(drawer.getByRole('textbox', { name: 'Description', exact: true })).toBeVisible();
  await drawer.getByLabel('Schedule & Reminder options', { exact: true }).click();
  await expect(drawer.getByRole('button', { name: 'Remove Schedule & Reminder', exact: true })).toBeVisible();
  await expect(drawer.locator('.scheduling')).not.toHaveAttribute('open');
  await drawer.getByRole('button', { name: 'Remove Schedule & Reminder', exact: true }).press('Escape');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('button', { name: 'Remove Schedule & Reminder', exact: true })).not.toBeVisible();
  await drawer.locator('.scheduling summary').click();
  await expect(drawer.getByLabel('Scheduled date', { exact: true })).toBeVisible();
  await drawer.locator('.scheduling summary').click();
  for (const name of ['Schedule & Reminder', 'Related Tasks', 'Location']) {
    await drawer.getByLabel(`${name} options`, { exact: true }).click();
    await drawer.getByRole('button', { name: name === 'Location' ? 'Remove location' : `Remove ${name}`, exact: true }).click();
  }
  await expect(drawer.locator('.scheduling')).toHaveCount(0);
  await expect(drawer.getByRole('heading', { name: 'Location', exact: true })).toHaveCount(0);
  await expect(drawer.getByRole('heading', { name: 'Related Tasks', exact: true })).toHaveCount(0);
});

test('Places List keeps the map visible and normal tasks default to Location offline', async ({ page, context }) => {
  await transport(context);
  await page.goto('/');
  await page.getByRole('button', { name: 'New List', exact: true }).click();
  await page.getByRole('textbox', { name: 'List name', exact: true }).fill('Places to visit');
  await page.getByRole('radio', { name: 'Places List', exact: true }).check();
  await page.getByRole('button', { name: 'Create list', exact: true }).click();
  await page.getByRole('link', { name: /Places to visit/ }).click();
  await expect(page.locator('[aria-label="Task locations map"] .leaflet-map-pane')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Locations (0)', exact: true })).toBeVisible();
  await page.getByLabel('New task', { exact: true }).fill('Visit the museum');
  await page.getByLabel('New task', { exact: true }).press('Enter');
  await expect.poll(async () => (await device(page)).tasks.find((task: any) => task.title === 'Visit the museum')?.addons).toEqual(['location']);
  await page.getByRole('button', { name: 'Task details Visit the museum', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search places', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByLabel('Task Visit the museum', { exact: true })).toBeVisible();
  await expect(page.locator('[aria-label="Task locations map"] .leaflet-map-pane')).toHaveCount(1);
  await page.getByRole('button', { name: 'completeTask', exact: true }).click();
  await expect.poll(async () => (await device(page)).tasks.find((task: any) => task.title === 'Visit the museum')?.complete).toBe(true);
});

test('Places URL import previews candidates and saves a normal task with coordinates', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const server = await transport(context);
  server.snapshot.lists[0].type = 'places';
  const location = { name: 'Marco Zero', address: 'Recife, Brazil', latitude: -8.063, longitude: -34.871, source: 'openstreetmap', placeId: 'N123' };
  await page.route('**/api/places', async (route) => {
    const input = route.request().postDataJSON().input;
    expect(input).toBe('https://www.google.com/search?q=Marco+Zero+Recife');
    await route.fulfill({ json: { places: [location] } });
  });
  await page.goto(`/tasks?listId=${listId}`);
  await page.getByLabel('New task', { exact: true }).fill('https://www.google.com/search?q=Marco+Zero+Recife');
  await page.getByLabel('New task', { exact: true }).press('Enter');
  await expect(page.getByText('Choose a place to add', { exact: true })).toBeVisible();
  expect((await device(page)).tasks).toHaveLength(0);
  await page.getByRole('button', { name: 'Add Marco Zero', exact: true }).click();
  await expect.poll(async () => (await device(page)).tasks[0]?.location).toEqual(location);
  expect((await device(page)).tasks[0]).toMatchObject({ title: 'Marco Zero', complete: false, addons: ['location'] });
  await expect(page.locator('.location-marker')).toHaveCount(1);
  await expect(page.getByLabel('New task', { exact: true })).toHaveValue('');
  await page.screenshot({ path: '/tmp/maitu-places-list.png' });
});

test('Smart Place inclusion resolves pasted captions and keeps failed input editable', async ({ page, context }) => {
  const server = await transport(context);
  server.snapshot.lists[0].type = 'places';
  await page.setViewportSize({ width: 390, height: 844 });
  const location = { name: 'Cafe do Sol', address: 'Rua das Flores 12, Recife', latitude: -8.063, longitude: -34.871, source: 'openstreetmap', placeId: 'N789' };
  const inputs: string[] = [];
  await page.route('**/api/places', async (route) => {
    const input = route.request().postDataJSON().input;
    inputs.push(input);
    await route.fulfill(input.includes('private-post')
      ? { status: 422, json: { error: 'Could not identify a place from this page. Paste its caption, place name or address instead.' } }
      : { json: { places: [location] } });
  });
  await page.goto(`/tasks?listId=${listId}`);
  const smart = page.getByRole('region', { name: 'Smart Place inclusion', exact: true });
  const field = smart.getByRole('textbox', { name: 'Place info', exact: true });
  const caption = '📍 Cafe do Sol\nRua das Flores 12, Recife\n@travel #recife';
  await field.evaluate((node, text) => {
    const transfer = new DataTransfer(); transfer.setData('text/plain', text);
    node.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: transfer }));
  }, caption);
  await expect(smart.getByRole('button', { name: 'Add Cafe do Sol', exact: true })).toBeVisible();
  expect(inputs).toEqual([caption]);
  expect((await device(page)).tasks).toHaveLength(0);
  await smart.getByRole('button', { name: 'Add Cafe do Sol', exact: true }).click();
  await expect.poll(async () => (await device(page)).tasks[0]?.location).toEqual(location);
  await expect(field).toHaveValue('');
  await expect(page.locator('.location-marker')).toHaveCount(1);
  await field.fill('https://instagram.com/p/private-post/');
  await smart.getByRole('button', { name: 'Find place', exact: true }).click();
  await expect(smart.getByRole('alert')).toContainText('Paste its caption');
  await expect(field).toHaveValue('https://instagram.com/p/private-post/');
  expect((await device(page)).tasks).toHaveLength(1);
  await page.screenshot({ path: '/tmp/maitu-smart-place.png' });
});

test('Smart Place inclusion ignores stale candidates after the pasted input changes', async ({ page, context }) => {
  const server = await transport(context);
  server.snapshot.lists[0].type = 'places';
  let release: () => void;
  const pending = new Promise<void>((resolve) => release = resolve);
  await page.route('**/api/places', async (route) => {
    const first = route.request().postDataJSON().input === 'First place';
    if (first) await pending;
    await route.fulfill({ json: { places: [{ name: first ? 'Old result' : 'New result', address: 'Recife', latitude: -8, longitude: -34, source: 'manual', placeId: 'manual' }] } }).catch(() => {});
  });
  await page.goto(`/tasks?listId=${listId}`);
  const field = page.getByRole('textbox', { name: 'Place info', exact: true });
  await field.fill('First place');
  const request = page.waitForRequest((request) => request.url().endsWith('/api/places'));
  await page.getByRole('button', { name: 'Find place', exact: true }).click();
  await request;
  await field.fill('Second place');
  await page.getByRole('button', { name: 'Find place', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add New result', exact: true })).toBeVisible();
  release!();
  await expect(page.getByRole('button', { name: 'Add Old result', exact: true })).toHaveCount(0);
  expect((await device(page)).tasks).toHaveLength(0);
});
