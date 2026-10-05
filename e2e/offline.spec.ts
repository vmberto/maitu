import { expect, test } from '@playwright/test';
import { Colors } from '@/src/components/ColorPicker/ColorPicker';
import { ListType } from '@/types/main';
import type { Entity } from '@/src/lib/offline/model';
import type { LocalAccount } from '@/src/lib/offline/model';
import type { BrowserContext, Page } from '@playwright/test';

const user = {
  _id: '507f191e810c19729de860ea',
  username: 'Offline Tester',
  email: 'offline@example.com',
};
const listId = '64b2f7a9c1e6f9a1b2c3d4e5';
const taskId = '64b2f7a9c1e6f9a1b2c3d4e6';

// Transport fixture: the production service worker, IndexedDB, screens and queue are real.
// Server ownership/CAS/receipt behavior is tested independently in sync-server.test.ts.
async function transport(context: BrowserContext) {
  let activeUser = user;
  let failAcknowledgement = false;
  let writes = 0;
  let sessionDelay = 0;
  let snapshotDelay = 0;
  const snapshot: { lists: Entity[]; tasks: Entity[] } = {
    lists: [
      {
        _id: listId,
        id: listId,
        title: 'Offline list',
        emoji: '🌍',
        color: Colors.PRIMARY,
        type: ListType.tasks,
        index: 0,
        version: 0,
        createdAt: new Date().toISOString(),
      },
    ],
    tasks: [
      {
        _id: taskId,
        title: 'Original task',
        listId,
        parentTaskId: null,
        complete: false,
        description: '',
        version: 0,
        createdAt: new Date().toISOString(),
      },
    ],
  };
  const receipts = new Set<string>();
  await context.route('**/api/session', async (route) => {
    if (sessionDelay)
      await new Promise((resolve) => setTimeout(resolve, sessionDelay));
    await route.fulfill({ json: { user: activeUser } }).catch(() => {});
  });
  await context.route('**/api/sync', async (route) => {
    if (route.request().headers()['x-maitu-account'] !== activeUser._id)
      return route.fulfill({ status: 401, json: { error: 'Sign in' } });
    if (route.request().method() === 'GET') {
      const body = JSON.stringify(snapshot);
      if (snapshotDelay)
        await new Promise((resolve) => setTimeout(resolve, snapshotDelay));
      return route.fulfill({ body, contentType: 'application/json' });
    }
    const op = route.request().postDataJSON();
    const entities: any[] = snapshot[op.kind as 'lists' | 'tasks'];
    let item = entities.find((entity) => entity._id === op.entityId);
    if (!receipts.has(op.id)) {
      if ((item?.version ?? 0) !== op.baseVersion)
        return route.fulfill({
          json: {
            conflict: {
              server: item,
              message: 'This item changed on another device.',
            },
          },
        });
      if (!item) {
        item = { _id: op.entityId, version: 0 };
        entities.push(item);
      }
      Object.assign(item, op.data, {
        version: item.version + 1,
        deleted: op.action === 'delete',
      });
      receipts.add(op.id);
      writes += 1;
      if (failAcknowledgement) {
        failAcknowledgement = false;
        return route.abort('failed');
      }
    }
    return route.fulfill({ json: { entity: item } });
  });
  return {
    snapshot,
    delaySnapshot: (delay: number) => {
      snapshotDelay = delay;
    },
    delaySession: (delay: number) => {
      sessionDelay = delay;
    },
    setUser: (next: typeof user) => {
      activeUser = next;
    },
    loseNextResponse: () => {
      failAcknowledgement = true;
    },
    writes: () => writes,
  };
}

async function deviceState(page: Page): Promise<LocalAccount | null> {
  return page.evaluate(async () => {
    if (
      !(await indexedDB.databases()).some((db) => db.name === 'maitu-offline')
    )
      return null;
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('maitu-offline', 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const read = (key: string) =>
      new Promise<any>((resolve) => {
        const req = db.transaction('accounts').objectStore('accounts').get(key);
        req.onsuccess = () => resolve(req.result);
      });
    const active = await read('active');
    const account = active ? await read(`user:${active}`) : null;
    db.close();
    return account;
  });
}
async function waitSynced(page: Page) {
  await expect
    .poll(async () => {
      const saved = await deviceState(page);
      return !!saved?.lastSync && saved.queue.length === 0;
    })
    .toBe(true);
}
async function sync(page: Page) {
  const before = (await deviceState(page))?.lastSync;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect
    .poll(async () => (await deviceState(page))?.lastSync)
    .not.toBe(before);
}

async function ready(page: import('@playwright/test').Page) {
  await page.goto('/');
  await waitSynced(page);
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => resolve(),
          { once: true },
        ),
      );
    return !!registration.active;
  });
}

test('offline create, edit, complete, delete and navigation survive reload, then sync once', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  await ready(page);
  await context.setOffline(true);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await expect(
    page.getByRole('heading', { name: 'Offline list' }),
  ).toBeVisible();
  const existing = page
    .locator('textarea')
    .filter({ hasText: 'Original task' });
  await existing.fill('Edited offline');
  await expect
    .poll(
      async () =>
        (await deviceState(page))?.tasks.find((task) => task._id === taskId)
          ?.title,
    )
    .toBe('Edited offline');
  await page.reload();
  await expect(
    page.locator('textarea').filter({ hasText: 'Edited offline' }),
  ).toHaveValue('Edited offline');

  const input = page.locator('[data-task-input]');
  await input.fill('Created offline');
  await input.press('Enter');
  await expect(
    page
      .locator('textarea:not([data-task-input])')
      .filter({ hasText: 'Created offline' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .locator('textarea:not([data-task-input])')
      .filter({ hasText: 'Created offline' }),
  ).toBeVisible();
  await page.getByLabel('completeTask').first().click();
  await expect
    .poll(async () =>
      (await deviceState(page))?.tasks.some(
        (task) => task._id === taskId && 'complete' in task && task.complete,
      ),
    )
    .toBe(true);
  await page.reload();
  const created = page.locator(
    'textarea:not([data-task-input]):not([disabled])',
  );
  await created.fill('');
  await created.blur();
  await expect(created).toHaveCount(0);
  await page.reload();
  await expect(
    page
      .locator('textarea:not([data-task-input])')
      .filter({ hasText: 'Created offline' }),
  ).toHaveCount(0);
  await context.setOffline(false);
  await sync(page);
  await waitSynced(page);
  expect(
    server.snapshot.tasks.find((item) => item._id === taskId),
  ).toMatchObject({ title: 'Edited offline', complete: true });
  expect(server.snapshot.tasks.filter((item) => item.deleted)).toHaveLength(1);
  const writes = server.writes();
  await sync(page);
  await waitSynced(page);
  expect(server.writes()).toBe(writes);
});

test('retries a lost acknowledgement without creating duplicate tasks', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  await ready(page);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  server.loseNextResponse();
  const input = page.locator('[data-task-input]');
  await input.fill('Retry task');
  await input.press('Enter');
  await expect(page.getByText(/Could not sync/)).toBeVisible();
  await page.reload();
  await waitSynced(page);
  expect(
    server.snapshot.tasks.filter((item) => item.title === 'Retry task'),
  ).toHaveLength(1);
});

test('preserves conflicting edits until the user chooses a version', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  await ready(page);
  await context.setOffline(true);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await page
    .locator('textarea')
    .filter({ hasText: 'Original task' })
    .fill('My offline edit');
  await expect
    .poll(
      async () =>
        (await deviceState(page))?.tasks.find((task) => task._id === taskId)
          ?.title,
    )
    .toBe('My offline edit');
  server.snapshot.tasks[0].version = 1;
  server.snapshot.tasks[0].title = 'Other device edit';
  await context.setOffline(false);
  await sync(page);
  await expect(
    page.getByRole('region', { name: 'Sync conflict' }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText('On this device: My offline edit')).toBeVisible();
  await page.getByRole('button', { name: 'Keep my change' }).click();
  await waitSynced(page);
  expect(server.snapshot.tasks[0].title).toBe('My offline edit');
});

test('never uploads an old account’s queue under a new account', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  await ready(page);
  await context.setOffline(true);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await page
    .locator('textarea')
    .filter({ hasText: 'Original task' })
    .fill('Account A pending edit');
  await expect
    .poll(
      async () =>
        (await deviceState(page))?.tasks.find((task) => task._id === taskId)
          ?.title,
    )
    .toBe('Account A pending edit');
  const before = server.writes();
  server.setUser({
    ...user,
    _id: '507f191e810c19729de860eb',
    username: 'Account B',
  });
  server.snapshot.lists = [];
  server.snapshot.tasks = [];
  await context.setOffline(false);
  await sync(page);
  await waitSynced(page);
  expect(server.writes()).toBe(before);
  const queue = await page.evaluate(async (id) => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const req = indexedDB.open('maitu-offline', 1);
      req.onsuccess = () => resolve(req.result);
    });
    const saved = await new Promise<any>((resolve) => {
      const req = db
        .transaction('accounts')
        .objectStore('accounts')
        .get(`user:${id}`);
      req.onsuccess = () => resolve(req.result);
    });
    db.close();
    return saved.queue;
  }, user._id);
  expect(queue.length).toBeGreaterThan(0);
});

test('renders saved lists before a slow network session request finishes', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  await ready(page);
  server.delaySession(3000);
  const started = Date.now();
  await page.reload();
  await expect(page.getByRole('link', { name: '🌍 Offline list' })).toBeVisible(
    { timeout: 1000 },
  );
  const elapsed = Date.now() - started;
  expect(elapsed).toBeLessThan(1000);
  await test.info().attach('warm-start-latency', {
    body: JSON.stringify({
      elapsedMs: elapsed,
      simulatedSessionLatencyMs: 3000,
    }),
    contentType: 'application/json',
  });
});

test('opens saved data offline after all app tabs have closed', async ({
  page,
  context,
}) => {
  await transport(context);
  await ready(page);
  await page.close();
  await context.setOffline(true);
  const reopened = await context.newPage();
  await reopened.goto('/');
  await expect(
    reopened.getByRole('link', { name: '🌍 Offline list' }),
  ).toBeVisible();
  await reopened.getByRole('link', { name: '🌍 Offline list' }).click();
  await expect(
    reopened.locator('textarea').filter({ hasText: 'Original task' }),
  ).toBeVisible();
});

test('creates a new list and navigates into it without a network connection', async ({
  page,
  context,
}) => {
  await transport(context);
  await ready(page);
  await context.setOffline(true);
  await page.getByRole('button', { name: 'New List' }).click();
  await page.getByLabel('List Name').fill('Brand new offline list');
  await page.getByRole('button', { name: 'earth africa', exact: true }).click();
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  const link = page.getByRole('link', { name: '🌍 Brand new offline list' });
  await expect(link).toBeVisible();
  await page.reload();
  await link.click();
  await expect(
    page.getByRole('heading', { name: 'Brand new offline list' }),
  ).toBeVisible();
  await page.locator('[data-task-input]').fill('Task in a new offline list');
  await page.locator('[data-task-input]').press('Enter');
  await expect(
    page
      .locator('textarea:not([data-task-input])')
      .filter({ hasText: 'Task in a new offline list' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .locator('textarea:not([data-task-input])')
      .filter({ hasText: 'Task in a new offline list' }),
  ).toBeVisible();
});

test('timeline entries persist offline and sync through the same queue', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  server.snapshot.lists[0] = {
    ...server.snapshot.lists[0],
    type: ListType.timeline,
  } as Entity;
  await ready(page);
  await context.setOffline(true);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await page.getByPlaceholder("what's up?").fill('Offline timeline entry');
  await page.locator('section button').click();
  await expect(
    page.locator('p').filter({ hasText: 'Offline timeline entry' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator('p').filter({ hasText: 'Offline timeline entry' }),
  ).toBeVisible();
  await context.setOffline(false);
  await sync(page);
  await waitSynced(page);
  expect(
    server.snapshot.tasks.filter(
      (item) => item.title === 'Offline timeline entry',
    ),
  ).toHaveLength(1);
});

test('subtasks stay local, and closing the details panel restores top-level creation', async ({
  page,
  context,
}) => {
  await transport(context);
  await ready(page);
  await context.setOffline(true);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await page.getByLabel('openSlideOver').click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('[data-task-input]').fill('Offline subtask');
  await dialog.locator('[data-task-input]').press('Enter');
  await expect(
    dialog
      .locator('textarea:not([data-task-input])')
      .filter({ hasText: 'Offline subtask' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('[data-task-input]')).toHaveCount(1);
  await page.locator('[data-task-input]').fill('Top-level after closing');
  await page.locator('[data-task-input]').press('Enter');
  await expect(
    page
      .locator('textarea:not([data-task-input])')
      .filter({ hasText: 'Top-level after closing' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .locator('textarea:not([data-task-input])')
      .filter({ hasText: 'Top-level after closing' }),
  ).toBeVisible();
  await page.getByLabel('openSlideOver').first().click();
  await expect(
    page
      .getByRole('dialog')
      .locator('textarea:not([data-task-input])')
      .filter({ hasText: 'Offline subtask' }),
  ).toBeVisible();
});

test('offline logout locks access without deleting pending edits', async ({
  page,
  context,
}) => {
  await transport(context);
  await ready(page);
  await page.evaluate(async () => {
    await (
      await caches.open('pages')
    ).put('/legacy', new Response('legacy personal data'));
    await (
      await caches.open('unrelated-cache')
    ).put('/unrelated', new Response('keep'));
  });
  await context.setOffline(true);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await page
    .locator('textarea')
    .filter({ hasText: 'Original task' })
    .fill('Pending before logout');
  await expect
    .poll(
      async () =>
        (await deviceState(page))?.tasks.find((task) => task._id === taskId)
          ?.title,
    )
    .toBe('Pending before logout');
  await page.goto('/');
  await page.getByLabel('user-settings-menu').click();
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Login', exact: true }),
  ).toBeVisible();
  await page.goto('/');
  await expect(page).toHaveURL('/login');
  const saved = await page.evaluate(async (id) => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const req = indexedDB.open('maitu-offline', 1);
      req.onsuccess = () => resolve(req.result);
    });
    const result = await new Promise<any>((resolve) => {
      const req = db
        .transaction('accounts')
        .objectStore('accounts')
        .get(`user:${id}`);
      req.onsuccess = () => resolve(req.result);
    });
    db.close();
    return result;
  }, user._id);
  const cacheNames = await page.evaluate(() => caches.keys());
  expect(cacheNames).not.toContain('pages');
  expect(cacheNames).toContain('unrelated-cache');
  expect(saved.queue.length).toBeGreaterThan(0);
  expect(saved.tasks.find((task: any) => task._id === taskId).title).toBe(
    'Pending before logout',
  );
});

test('background sync stays quiet, preserves todo order, and flushes edits made during a refresh', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  server.snapshot.tasks.push(
    {
      ...server.snapshot.tasks[0],
      _id: '64b2f7a9c1e6f9a1b2c3d4e7',
      title: 'Second task',
    },
    {
      ...server.snapshot.tasks[0],
      _id: '64b2f7a9c1e6f9a1b2c3d4e8',
      title: 'Third task',
    },
  );
  await ready(page);
  await expect(
    page.getByRole('button', { name: 'Sync now', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText('All changes synced.')).toHaveCount(0);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await sync(page);
  const inputs = page.locator(
    'textarea:not([data-task-input]):not([disabled])',
  );
  expect(
    await inputs.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLTextAreaElement).value),
    ),
  ).toEqual(['Original task', 'Second task', 'Third task']);
  server.snapshot.tasks.reverse();
  server.delaySnapshot(1200);
  const fetching = page.waitForRequest(
    (request) =>
      request.url().endsWith('/api/sync') && request.method() === 'GET',
  );
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await fetching;
  await expect(page.getByRole('status')).toHaveCount(0);
  await inputs.first().fill('Edited first task');
  await expect
    .poll(
      async () =>
        (await deviceState(page))?.tasks.find((task) => task._id === taskId)
          ?.title,
    )
    .toBe('Edited first task');
  // The edit's debounce expires during the slow snapshot; it must still sync promptly.
  await waitSynced(page);
  await sync(page);
  expect(
    await inputs.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLTextAreaElement).value),
    ),
  ).toEqual(['Edited first task', 'Second task', 'Third task']);
  expect(server.snapshot.tasks.find((task) => task._id === taskId)?.title).toBe(
    'Edited first task',
  );
  await inputs.first().blur();
  await page.reload();
  await expect(inputs).toHaveCount(3);
  expect(
    await inputs.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLTextAreaElement).value),
    ),
  ).toEqual(['Edited first task', 'Second task', 'Third task']);
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Sync now', exact: true }),
  ).toHaveCount(0);
  await page.getByLabel('user-settings-menu').click();
  const settings = page.getByRole('region', { name: 'Sync settings' });
  await expect(settings.getByText('All changes synced.')).toBeVisible();
  await expect(
    settings.getByRole('button', { name: 'Sync now', exact: true }),
  ).toBeVisible();
  await expect(
    settings.getByRole('button', { name: 'Export device backup' }),
  ).toBeVisible();
});

test('dark mode persists across offline navigation and logout, and can be switched back', async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await transport(context);
  await ready(page);
  await page.getByLabel('user-settings-menu').click();
  const toggle = page.getByRole('switch', { name: 'Dark Mode' });
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect(page.locator('html')).toHaveClass('dark');
  expect(await page.evaluate(() => localStorage.getItem('maitu-theme'))).toBe(
    'dark',
  );
  expect(
    await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
  ).toBe('rgb(3, 7, 18)');
  expect(
    await page
      .getByRole('dialog')
      .locator('.bg-surface')
      .first()
      .evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe('rgb(17, 24, 39)');
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await context.setOffline(true);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await expect(page.locator('html')).toHaveClass('dark');
  await expect(
    page.locator('textarea').filter({ hasText: 'Original task' }),
  ).toBeVisible();
  expect(
    await page
      .locator('header')
      .evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe('rgb(17, 24, 39)');
  await page.reload();
  await expect(page.locator('html')).toHaveClass('dark');
  await page.goto('/');
  await page.getByLabel('user-settings-menu').click();
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  expect(
    await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
  ).toBe('rgb(255, 255, 255)');
  await page.reload();
  await expect(page.locator('html')).not.toHaveClass('dark');
  await page.getByLabel('user-settings-menu').click();
  await toggle.click();
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Login', exact: true }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveClass('dark');
});

test('uses the system theme until an explicit preference overrides it', async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await transport(context);
  await ready(page);
  await expect(page.locator('html')).toHaveClass('dark');
  expect(
    await page.evaluate(() => localStorage.getItem('maitu-theme')),
  ).toBeNull();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).not.toHaveClass('dark');
  await page.getByLabel('user-settings-menu').click();
  await page.getByRole('switch', { name: 'Dark Mode' }).click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveClass('dark');
});

test('main routes switch within one document offline, including browser back/forward', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  const timelineId = '64b2f7a9c1e6f9a1b2c3d4e9';
  server.snapshot.lists.push({
    ...server.snapshot.lists[0],
    _id: timelineId,
    id: timelineId,
    title: 'My timeline',
    type: ListType.timeline,
    index: 1,
  });
  server.snapshot.tasks.push({
    ...server.snapshot.tasks[0],
    _id: '64b2f7a9c1e6f9a1b2c3d4ea',
    listId: timelineId,
    title: 'Timeline entry',
  });
  await ready(page);
  const marker = await page.evaluate(() => {
    const marker = crypto.randomUUID();
    (window as any).__maituDocument = marker;
    return marker;
  });
  const navigationRequests: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    if (
      request.resourceType() === 'document' ||
      new URL(request.url()).searchParams.has('_rsc')
    )
      navigationRequests.push(request.url());
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydrat/i.test(message.text()))
      errors.push(message.text());
  });
  await context.setOffline(true);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await expect(
    page.getByRole('heading', { name: 'Offline list' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Back to lists' }).click();
  await expect(
    page.getByRole('link', { name: '🌍 My timeline' }),
  ).toBeVisible();
  await page.getByRole('link', { name: '🌍 My timeline' }).click();
  await expect(
    page.locator('p').filter({ hasText: 'Timeline entry' }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole('link', { name: '🌍 Offline list' }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'Offline list' }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole('link', { name: '🌍 My timeline' }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.locator('p').filter({ hasText: 'Timeline entry' }),
  ).toBeVisible();
  expect(await page.evaluate(() => (window as any).__maituDocument)).toBe(
    marker,
  );
  expect(navigationRequests).toEqual([]);
  await expect(page.getByText(/Opening (Maitu|tasks|timeline)/)).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'My timeline' }),
  ).toBeVisible();
  await expect(
    page.locator('p').filter({ hasText: 'Timeline entry' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('an extension-added body attribute does not trigger a hydration warning', async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (document.body) {
        document.body.setAttribute('cz-shortcut-listen', 'true');
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydrat/i.test(message.text()))
      errors.push(message.text());
  });
  await transport(context);
  await ready(page);
  await expect(page.locator('body')).toHaveAttribute(
    'cz-shortcut-listen',
    'true',
  );
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await expect(
    page.getByRole('heading', { name: 'Offline list' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
