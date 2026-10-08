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
  await page
    .getByRole('textbox', { name: 'Description', exact: true })
    .fill('Durable description');
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
  await page.getByText('Task Options', { exact: true }).click();
  await page.getByRole('button', { name: 'Location', exact: true }).click();
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

test('timeline, tags, subtasks and cloning preserve their data offline', async ({
  page,
  context,
}) => {
  await transport(context);
  await page.goto('/');
  await page.getByRole('button', { name: 'New List', exact: true }).click();
  await page.getByRole('textbox', { name: 'List name' }).fill('Journal');
  await page
    .getByRole('combobox', { name: 'List type' })
    .selectOption('timeline');
  await page.getByRole('button', { name: 'Add list', exact: true }).click();
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
  await page.getByRole('textbox', { name: 'New subtask' }).fill('Child');
  await page
    .getByRole('textbox', { name: 'New subtask', exact: true })
    .press('Enter');
  await page
    .getByRole('textbox', { name: 'Subtask Child' })
    .fill('Edited child');
  await page.getByRole('textbox', { name: 'New tag' }).fill('food');
  await page.getByRole('textbox', { name: 'New tag' }).press('Enter');
  await page.getByText('Task Options', { exact: true }).click();
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
  await page.getByText('Task Options', { exact: true }).click();
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
