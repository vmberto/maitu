import { expect, test } from '@playwright/test';
import { Colors } from '@/src/components/ColorPicker/ColorPicker';
import { ListType, type Task } from '@/types/main';
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
  await expect(page.getByRole('region', { name: 'Sync settings' })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('button', { name: 'Sync now', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Export device backup' }),
  ).toHaveCount(0);
  await expect(page.getByRole('switch', { name: 'Dark Mode' })).toBeVisible();
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

test('completion gives a durable undo window before moving the row, and remains reversible later', async ({
  page,
  context,
}) => {
  await transport(context);
  await ready(page);
  await context.setOffline(true);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  const complete = page.getByRole('button', {
    name: 'completeTask',
    exact: true,
  });
  await complete.click();
  await expect(complete).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Click again to undo')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Complete Tasks' }),
  ).toHaveCount(0);
  await expect
    .poll(async () =>
      (await deviceState(page))?.tasks.some(
        (task) => task._id === taskId && 'complete' in task && task.complete,
      ),
    )
    .toBe(true);
  await complete.click();
  await expect(complete).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByText('Click again to undo')).toHaveCount(0);
  await page.reload();
  await expect(complete).toHaveAttribute('aria-pressed', 'false');
  await complete.click();
  await expect(page.getByText('Click again to undo')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Complete Tasks' }),
  ).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'openSlideOver' }).click();
  await page.getByRole('button', { name: 'Task options' }).click();
  await page.getByRole('button', { name: 'Move to undone' }).click();
  await expect(
    page.getByRole('button', { name: 'Move to undone' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Complete Tasks' }),
  ).toHaveCount(0);
  await expect(complete).toHaveAttribute('aria-pressed', 'false');
});

test('headers share their dimensions and list drawers slide with readable fields in dark mode', async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await transport(context);
  await ready(page);
  const homeHeight = await page
    .locator('header')
    .evaluate((node) => node.getBoundingClientRect().height);
  expect(homeHeight).toBe(48);
  expect(
    await page
      .locator('header')
      .evaluate((node) => getComputedStyle(node).backgroundImage),
  ).toBe('none');
  await page.getByRole('button', { name: 'list-details', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit list' });
  const panel = dialog.locator('[data-drawer-panel]');
  await expect
    .poll(() =>
      panel.evaluate((node) =>
        node
          .getAnimations()
          .some(
            (animation) =>
              Number(animation.effect?.getComputedTiming().duration) > 0,
          ),
      ),
    )
    .toBe(true);
  const input = dialog.getByRole('textbox', { name: 'List name' });
  await expect(input).toHaveValue('Offline list');
  await input.fill('Renamed list');
  expect(
    await input.evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe('rgb(3, 7, 18)');
  expect(
    await dialog
      .locator('.drawer-section')
      .first()
      .evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe('rgb(31, 41, 55)');
  await expect
    .poll(async () => (await deviceState(page))?.lists[0].title)
    .toBe('Renamed list');
  await expect
    .poll(() => panel.evaluate((node) => node.getAnimations().length))
    .toBe(0);
  await page.screenshot({
    path: test.info().outputPath('dark-list-drawer.png'),
  });
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await page.getByRole('link', { name: '🌍 Renamed list' }).click();
  expect(
    await page
      .locator('header')
      .evaluate((node) => node.getBoundingClientRect().height),
  ).toBe(homeHeight);
  await page.getByRole('button', { name: 'openSlideOver' }).click();
  const taskDialog = page.getByRole('dialog');
  await expect
    .poll(() =>
      taskDialog
        .locator('[data-drawer-panel]')
        .evaluate((node) =>
          node
            .getAnimations()
            .some(
              (animation) =>
                Number(animation.effect?.getComputedTiming().duration) > 0,
            ),
        ),
    )
    .toBe(true);
  await expect(
    taskDialog.getByRole('textbox', { name: 'Description' }),
  ).toBeVisible();
  const sections = await taskDialog
    .locator('.drawer-section')
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        background: getComputedStyle(node).backgroundColor,
        border: getComputedStyle(node).borderTopWidth,
      })),
    );
  expect(sections.length).toBeGreaterThanOrEqual(3);
  expect(
    sections.every(
      (section) =>
        section.background === 'rgb(31, 41, 55)' && section.border === '0px',
    ),
  ).toBe(true);
  await expect
    .poll(() =>
      taskDialog
        .locator('[data-drawer-panel]')
        .evaluate((node) => node.getAnimations().length),
    )
    .toBe(0);
  await page.screenshot({
    path: test.info().outputPath('dark-task-drawer.png'),
  });
});

test('all lists remain visible without search or pagination', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  server.snapshot.lists = Array.from({ length: 30 }, (_, index) => ({
    ...server.snapshot.lists[0],
    _id: (index + 100).toString(16).padStart(24, '0'),
    id: String(index),
    title: `List ${index + 1}`,
    index,
  }));
  await ready(page);
  const cards = page.locator('a[href^="/tasks?listId="]');
  await expect(cards).toHaveCount(30);
  await expect(page.getByRole('searchbox')).toHaveCount(0);
  await context.setOffline(true);
  await page.getByRole('link', { name: '🌍 List 30' }).click();
  await expect(page.getByRole('heading', { name: 'List 30' })).toBeVisible();
});

test('the native emoji picker fits a narrow mobile drawer', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await transport(context);
  await ready(page);
  await page.getByRole('button', { name: 'list-details', exact: true }).click();
  const picker = page.getByRole('region', { name: 'Choose list emoji' });
  await expect(
    picker.getByRole('button', { name: 'earth africa' }),
  ).toBeInViewport();
  const fits = await picker.locator('.grid').evaluate((grid) => {
    const bounds = grid.getBoundingClientRect();
    return Array.from(grid.children).every((button) => {
      const rect = button.getBoundingClientRect();
      return rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1;
    });
  });
  expect(fits).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('tasks reveal cached batches on scroll while offline', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  server.snapshot.tasks = Array.from({ length: 65 }, (_, index) => ({
    ...server.snapshot.tasks[0],
    _id: (index + 200).toString(16).padStart(24, '0'),
    title: `Cached task ${index + 1}`,
  }));
  server.snapshot.tasks.push(
    ...Array.from({ length: 45 }, (_, index) => ({
      ...server.snapshot.tasks[0],
      _id: (index + 400).toString(16).padStart(24, '0'),
      title: `Finished task ${index + 1}`,
      complete: true,
      completedAt: '2026-01-01T00:00:00.000Z',
    })),
  );
  await ready(page);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await expect(
    page.locator('textarea').filter({ hasText: 'Cached task 20' }),
  ).toBeVisible();
  await expect(
    page.locator('textarea').filter({ hasText: 'Cached task 21' }),
  ).toHaveCount(0);
  await context.setOffline(true);
  for (const count of [40, 60, 65]) {
    await page
      .getByRole('button', { name: 'More tasks' })
      .first()
      .scrollIntoViewIfNeeded();
    await expect(
      page.locator(`textarea`).filter({ hasText: `Cached task ${count}` }),
    ).toHaveCount(1);
  }
  const completed = page.locator('#complete-tasks');
  for (const count of [40, 45]) {
    await completed
      .getByRole('button', { name: 'More tasks' })
      .scrollIntoViewIfNeeded();
    await expect(completed.locator('textarea')).toHaveCount(count);
  }
  await expect(page.getByRole('button', { name: 'More tasks' })).toHaveCount(0);
});

test('a location add-on stores selected coordinates, survives offline reload, syncs and can be removed offline', async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  const server = await transport(context);
  const location = {
    name: 'Restaurant X',
    address: 'Rua do Sol 12, Recife, Brazil',
    latitude: -8.063,
    longitude: -34.881,
    source: 'openstreetmap',
    placeId: 'N123',
  };
  let searches = 0;
  await context.route('**/api/places?*', async (route) => {
    searches += 1;
    expect(new URL(route.request().url()).searchParams.get('q')).toBe(
      'Restaurant X Recife',
    );
    await route.fulfill({
      json: {
        places: [
          location,
          {
            ...location,
            name: 'Restaurant X Olinda',
            address: 'Olinda, Brazil',
            placeId: 'W456',
          },
        ],
      },
    });
  });
  await ready(page);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await page.getByRole('button', { name: 'openSlideOver' }).click();
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await expect(
    page.getByRole('region', { name: 'Location add-on' }),
  ).toHaveCount(0);
  const options = page.getByRole('button', { name: 'Task options' });
  await options.click();
  await expect(options).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'Add location', exact: true }).click();
  let addon = page.getByRole('region', { name: 'Location add-on' });
  await addon
    .getByRole('textbox', { name: 'Place name and city' })
    .fill('Restaurant X Recife');
  expect(searches).toBe(0);
  await addon.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(
    addon.getByRole('list', { name: 'Places' }).getByRole('button'),
  ).toHaveCount(2);
  await context.setOffline(true);
  await addon
    .getByRole('button', {
      name: 'Restaurant X Rua do Sol 12, Recife, Brazil',
      exact: true,
    })
    .click();
  await expect(
    addon.getByText('Lat -8.063000 · Long -34.881000'),
  ).toBeVisible();
  await expect
    .poll(
      async () =>
        ((await deviceState(page))?.tasks[0] as Task | undefined)?.location,
    )
    .toEqual(location);
  await page.reload();
  await page.getByRole('button', { name: 'openSlideOver' }).click();
  addon = page.getByRole('region', { name: 'Location add-on' });
  await expect(addon.getByText('Restaurant X', { exact: true })).toBeVisible();
  await addon.getByRole('button', { name: 'Location options' }).click();
  await page.getByRole('menuitem', { name: 'Change location' }).click();
  await addon.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(addon.getByRole('alert')).toContainText(
    'Connect to the internet',
  );
  expect(searches).toBe(1);
  await addon.getByRole('button', { name: 'Cancel' }).click();
  await context.setOffline(false);
  await sync(page);
  expect(server.snapshot.tasks[0]).toHaveProperty('location', location);
  await page.screenshot({
    path: test.info().outputPath('location-addon-dark.png'),
  });
  await page.getByRole('button', { name: 'Task options' }).click();
  await context.setOffline(true);
  await addon.getByRole('button', { name: 'Location options' }).click();
  await page.getByRole('menuitem', { name: 'Remove location add-on' }).click();
  await expect(
    page.getByRole('button', { name: 'Add location', exact: true }),
  ).toBeVisible();
  await expect
    .poll(
      async () =>
        ((await deviceState(page))?.tasks[0] as Task | undefined)?.location,
    )
    .toBeNull();
  await context.setOffline(false);
  await sync(page);
  expect(server.snapshot.tasks[0]).toHaveProperty('location', null);
  expect(server.snapshot.tasks[0]).toHaveProperty('addons', []);
  expect(errors.filter((error) => /same key|unique.*key/i.test(error))).toEqual(
    [],
  );
});

test('location search handles empty results and service errors without changing a legacy location', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  server.snapshot.tasks[0] = {
    ...server.snapshot.tasks[0],
    location: 'Old restaurant address',
  };
  let calls = 0;
  await context.route('**/api/places?*', async (route) => {
    calls += 1;
    await route.fulfill(
      calls === 1
        ? { json: { places: [] } }
        : {
            status: 503,
            json: {
              error:
                'Place search is temporarily unavailable. Try again shortly.',
            },
          },
    );
  });
  await ready(page);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await page.getByRole('button', { name: 'openSlideOver' }).click();
  const addon = page.getByRole('region', { name: 'Location add-on' });
  await expect(
    addon.getByText('Old restaurant address', { exact: true }),
  ).toBeVisible();
  await addon.getByRole('button', { name: 'Location options' }).click();
  await page.getByRole('menuitem', { name: 'Change location' }).click();
  await addon
    .getByRole('textbox', { name: 'Place name and city' })
    .fill('Restaurant X Recife');
  await addon.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(addon.getByRole('status')).toContainText('No places found');
  await addon.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(addon.getByRole('alert')).toContainText(
    'temporarily unavailable',
  );
  await expect
    .poll(
      async () =>
        ((await deviceState(page))?.tasks[0] as Task | undefined)?.location,
    )
    .toBe('Old restaurant address');
});

test('task options animate and an empty location block can be added and removed offline', async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await transport(context);
  await ready(page);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await page.getByRole('button', { name: 'openSlideOver' }).click();
  const options = page.getByRole('button', { name: 'Task options' });
  const panel = page.locator('.drawer-expandable');
  await expect
    .poll(() => panel.evaluate((node) => node.getBoundingClientRect().height))
    .toBe(0);
  await options.click();
  await expect
    .poll(() => panel.evaluate((node) => node.getBoundingClientRect().height))
    .toBeGreaterThan(100);
  expect(
    await panel.evaluate((node) => getComputedStyle(node).transitionProperty),
  ).toContain('grid-template-rows');
  await expect
    .poll(() => panel.evaluate((node) => node.getAnimations().length))
    .toBe(0);
  await page.screenshot({
    path: test.info().outputPath('task-options-buttons.png'),
  });
  await options.click();
  await expect
    .poll(() => panel.evaluate((node) => node.getBoundingClientRect().height))
    .toBe(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await options.click();
  expect(
    await panel.evaluate((node) => getComputedStyle(node).transitionDuration),
  ).toBe('0s');
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Add location', exact: true }).click();
  await expect
    .poll(
      async () =>
        ((await deviceState(page))?.tasks[0] as Task | undefined)?.addons,
    )
    .toEqual(['location']);
  await page.reload();
  await page.getByRole('button', { name: 'openSlideOver' }).click();
  const block = page.getByRole('region', { name: 'Location add-on' });
  await expect(
    block.getByRole('textbox', { name: 'Place name and city' }),
  ).toBeVisible();
  await block.getByRole('button', { name: 'Location options' }).click();
  await page.getByRole('menuitem', { name: 'Remove location add-on' }).click();
  await expect(block).toHaveCount(0);
  await page.getByRole('button', { name: 'Task options' }).click();
  await expect(
    page.getByRole('button', { name: 'Add location', exact: true }),
  ).toBeVisible();
});

test('list map toggles through the shared header, scopes locations and supports a searchable drawer offline', async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  const server = await transport(context);
  server.snapshot.lists[0] = {
    ...server.snapshot.lists[0],
    color: Colors.RED_COLOR,
  };
  server.snapshot.tasks[0] = {
    ...server.snapshot.tasks[0],
    location: 'Legacy address',
    addons: ['location'],
  };
  let tileRequests = 0;
  await context.route('https://tile.openstreetmap.org/**', async (route) => {
    tileRequests += 1;
    await route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jGxkAAAAASUVORK5CYII=',
        'base64',
      ),
    });
  });
  await ready(page);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await expect(
    page.getByRole('link', { name: 'Map', exact: true }),
  ).toHaveCount(0);
  const template = server.snapshot.tasks[0];
  const located = (
    id: string,
    title: string,
    latitude: number,
    complete = false,
  ) => ({
    ...template,
    _id: id,
    title,
    complete,
    completedAt: complete ? '2026-01-01T00:00:00.000Z' : null,
    location: {
      name: title,
      address: 'Recife, Brazil',
      latitude,
      longitude: -34.881,
      source: 'openstreetmap' as const,
      placeId: 'N123',
    },
  });
  server.snapshot.lists.push({
    ...server.snapshot.lists[0],
    _id: '000000000000000000000999',
    title: 'Other list',
  });
  server.snapshot.tasks.push(
    located('000000000000000000000101', 'Restaurant One', -8.063),
    located('000000000000000000000102', 'Restaurant Two', -8.073),
    located('000000000000000000000103', 'Finished restaurant', -8.083, true),
    {
      ...located('000000000000000000000104', 'Other list restaurant', -8.093),
      listId: '000000000000000000000999',
    },
  );
  await sync(page);
  await expect(
    page.getByRole('link', { name: 'Map', exact: true }),
  ).toBeVisible();
  expect(tileRequests).toBe(0);
  await page.getByRole('link', { name: 'Map', exact: true }).click();
  const map = page.locator('main');
  await expect(page).toHaveURL(/\/tasks\/map\?/);
  await expect(
    page.getByRole('heading', { name: 'Offline list', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Map', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(
    map.getByRole('region', { name: 'Map of task locations' }),
  ).toBeVisible();
  await expect(map.locator('.task-map-marker')).toHaveCount(3);
  await expect(map.locator('.task-map-marker-complete')).toHaveCount(1);
  await expect(
    map.locator('.task-map-marker:not(.task-map-marker-complete)'),
  ).toHaveCount(2);
  await expect(page.getByLabel('Map legend')).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Located tasks' })).toHaveCount(
    0,
  );
  await map.getByRole('button', { name: 'Locations (3)' }).click();
  const drawer = page.getByRole('dialog', { name: 'Locations', exact: true });
  await expect(
    drawer.getByRole('list', { name: 'Located tasks' }).getByRole('button'),
  ).toHaveCount(3);
  await drawer
    .getByRole('searchbox', { name: 'Search locations' })
    .fill('Finished');
  await expect(
    drawer.getByRole('list', { name: 'Located tasks' }).getByRole('button'),
  ).toHaveCount(1);
  await drawer.getByRole('button', { name: /Finished restaurant/ }).click();
  await expect(drawer).toHaveCount(0);
  await expect(
    map.getByRole('region', { name: 'Selected place' }),
  ).toContainText('Finished restaurant');
  await map.getByRole('button', { name: 'Locations (3)' }).click();
  await drawer
    .getByRole('searchbox', { name: 'Search locations' })
    .fill('Restaurant One');
  await drawer
    .getByRole('list', { name: 'Located tasks' })
    .getByRole('button')
    .click();
  await map
    .getByRole('button', { name: 'Show Restaurant One', exact: true })
    .click();
  const selected = map.getByRole('region', { name: 'Selected place' });
  await expect(
    selected.getByRole('heading', { name: 'Restaurant One' }),
  ).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('task-map-dark.png') });
  await selected.getByRole('link', { name: 'Open task' }).click();
  await expect(page).toHaveURL(/\/tasks\?/);
  await expect(
    page.getByRole('dialog').getByRole('heading').first(),
  ).toContainText('Restaurant One');
  await page.getByRole('link', { name: 'See on Map' }).click();
  await expect(page).toHaveURL(
    /\/tasks\/map\?.*taskId=000000000000000000000101/,
  );
  await expect(
    page.getByRole('region', { name: 'Selected place' }),
  ).toContainText('Restaurant One');
  await context.setOffline(true);
  await page.reload();
  await expect(map.locator('.task-map-marker')).toHaveCount(3);
  await map.getByRole('button', { name: 'Locations (3)' }).click();
  await drawer
    .getByRole('searchbox', { name: 'Search locations' })
    .fill('Recife');
  await expect(
    drawer.getByRole('list', { name: 'Located tasks' }).getByRole('button'),
  ).toHaveCount(3);
  await drawer.getByRole('button', { name: 'Close locations' }).click();
  await page.getByRole('link', { name: 'Map', exact: true }).click();
  await expect(page).toHaveURL(/\/tasks\?/);
  await expect(
    page.getByRole('heading', { name: 'Offline list', exact: true }),
  ).toBeVisible();
  await expect(map).toHaveCount(0);
});

test('the locations drawer fits mobile and scrolls a large cached list', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const server = await transport(context);
  server.snapshot.tasks = Array.from({ length: 40 }, (_, index) => ({
    ...server.snapshot.tasks[0],
    _id: (index + 500).toString(16).padStart(24, '0'),
    title: `Place ${index + 1}`,
    location: {
      name: `Place ${index + 1}`,
      address: 'Recife',
      latitude: -8.063 + index * 0.001,
      longitude: -34.881,
      source: 'openstreetmap' as const,
      placeId: `N${index + 1}`,
    },
  }));
  await context.route('https://tile.openstreetmap.org/**', (route) =>
    route.abort(),
  );
  await ready(page);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await page.getByRole('link', { name: 'Map', exact: true }).click();
  await page.getByRole('button', { name: 'Locations (40)' }).click();
  const drawer = page.getByRole('dialog', { name: 'Locations', exact: true });
  const rows = drawer
    .getByRole('list', { name: 'Located tasks' })
    .getByRole('button');
  await expect(rows).toHaveCount(40);
  await rows.last().scrollIntoViewIfNeeded();
  await expect(rows.last()).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await drawer
    .getByRole('searchbox', { name: 'Search locations' })
    .fill('Place 40');
  await expect(rows).toHaveCount(1);
  await rows.first().click();
  await expect(drawer).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Selected place' }),
  ).toContainText('Place 40');
});

test('manual coordinates validate, save offline, show on the map and sync without place search', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  let searches = 0;
  await context.route('**/api/places?*', async (route) => {
    searches += 1;
    await route.fulfill({ json: { places: [] } });
  });
  await context.route('https://tile.openstreetmap.org/**', (route) =>
    route.abort(),
  );
  await ready(page);
  await context.setOffline(true);
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await page.getByRole('button', { name: 'openSlideOver' }).click();
  await page.getByRole('button', { name: 'Task options' }).click();
  await page.getByRole('button', { name: 'Add location', exact: true }).click();
  let addon = page.getByRole('region', { name: 'Location add-on' });
  await addon.getByRole('button', { name: 'Enter coordinates' }).click();
  await addon
    .getByRole('textbox', { name: 'Coordinates', exact: true })
    .fill('95, -34.881');
  await addon.getByRole('button', { name: 'Save coordinates' }).click();
  await expect(addon.getByRole('alert')).toContainText('between');
  await addon
    .getByRole('textbox', { name: 'Coordinates', exact: true })
    .fill('-8.063, -34.881');
  await expect(
    addon.getByText('Latitude -8.063 · Longitude -34.881'),
  ).toBeVisible();
  await addon.getByRole('button', { name: 'Save coordinates' }).click();
  await expect(
    addon.getByText('Lat -8.063000 · Long -34.881000'),
  ).toBeVisible();
  const location = {
    name: 'Original task',
    address: '',
    latitude: -8.063,
    longitude: -34.881,
    source: 'manual',
    placeId: 'manual',
  };
  await expect
    .poll(
      async () =>
        ((await deviceState(page))?.tasks[0] as Task | undefined)?.location,
    )
    .toEqual(location);
  expect(searches).toBe(0);
  await page.reload();
  await page.getByRole('button', { name: 'openSlideOver' }).click();
  addon = page.getByRole('region', { name: 'Location add-on' });
  await expect(
    addon.getByText('Lat -8.063000 · Long -34.881000'),
  ).toBeVisible();
  await addon.getByRole('link', { name: 'See on Map' }).click();
  await expect(
    page.getByRole('region', { name: 'Map of task locations' }),
  ).toBeVisible();
  await expect(page.locator('.task-map-marker')).toHaveCount(1);
  await expect(
    page.getByRole('region', { name: 'Selected place' }),
  ).toContainText('Original task');
  await expect(
    page.getByRole('region', { name: 'Selected place' }),
  ).toContainText('Lat -8.063000 · Long -34.881000');
  await expect(
    page
      .getByRole('region', { name: 'Selected place' })
      .getByText('Original task', { exact: true }),
  ).toHaveCount(1);
  await context.setOffline(false);
  await sync(page);
  expect(server.snapshot.tasks[0]).toHaveProperty('location', location);
});

test('archived lists are accessible from the theme sidebar and remain read only offline', async ({
  page,
  context,
}) => {
  const server = await transport(context);
  server.snapshot.lists.push({
    ...server.snapshot.lists[0],
    _id: '000000000000000000000900',
    id: 'second',
    title: 'Active list',
    index: 1,
  });
  await ready(page);
  await context.setOffline(true);
  await page
    .getByRole('button', { name: 'list-details', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: 'Archive list', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '🌍 Offline list' })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('link', { name: '🌍 Active list' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'user-settings-menu' }).click();
  await page.getByRole('link', { name: 'Archived Lists', exact: true }).click();
  await expect(page).toHaveURL('/archived');
  await expect(
    page.getByRole('heading', { name: 'Archived Lists' }),
  ).toBeVisible();
  await page.getByRole('link', { name: '🌍 Offline list' }).click();
  await expect(page.getByText('Archived · Read only')).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('button')).toHaveCount(0);
  await page.getByText('Original task', { exact: true }).click();
  await page.reload();
  await expect(page.getByText('Archived · Read only')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'completeTask', exact: true }),
  ).toHaveCount(0);
  await context.setOffline(false);
  await sync(page);
  expect(server.snapshot.lists[0]).toHaveProperty('archived', true);
});

test('drawers lock background scrolling, allow inner scrolling and restore the original position', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const server = await transport(context);
  server.snapshot.lists = Array.from({ length: 20 }, (_, index) => ({
    ...server.snapshot.lists[0],
    _id: (index + 600).toString(16).padStart(24, '0'),
    title: `Scroll list ${index + 1}`,
    index,
  }));
  await ready(page);
  const button = page
    .getByRole('button', { name: 'list-details', exact: true })
    .nth(10);
  await button.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(0);
  await button.click();
  await expect
    .poll(() => page.evaluate(() => document.body.style.position))
    .toBe('fixed');
  const locked = await page.evaluate(() => document.body.style.top);
  await page.mouse.move(5, 5);
  await page.mouse.wheel(0, 500);
  expect(await page.evaluate(() => document.body.style.top)).toBe(locked);
  const drawer = page.getByRole('dialog', { name: 'Edit list' });
  await drawer
    .getByRole('button', { name: 'Archive list', exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    drawer.getByRole('button', { name: 'Archive list', exact: true }),
  ).toBeInViewport();
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => document.body.style.position))
    .not.toBe('fixed');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
  await page.getByRole('button', { name: 'user-settings-menu' }).click();
  await expect
    .poll(() => page.evaluate(() => document.body.style.position))
    .toBe('fixed');
  await page.getByRole('link', { name: 'Archived Lists', exact: true }).click();
  await expect(page).toHaveURL('/archived');
  await expect
    .poll(() => page.evaluate(() => document.body.style.position))
    .not.toBe('fixed');
});
