import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';
import { enqueue, mergeSnapshot } from './model';
import type { Entity, LocalAccount } from './model';
import { change, readAccount, accountKey, readStartup } from './storage';

const user = {
  _id: '507f191e810c19729de860ea',
  username: 'Test',
  email: 'test@example.com',
};
const list = {
  _id: '64b2f7a9c1e6f9a1b2c3d4e5',
  title: 'List',
  version: 0,
  index: 0,
} as Entity;
const initial: LocalAccount = { user, lists: [list], tasks: [], queue: [] };
it('loads the active account consistently and never restores a signed-out account', async () => {
  await change(accountKey(user._id), () => initial);
  await change('active', () => user._id);
  await change('signedOut', () => false);
  expect(await readStartup()).toEqual({ signedOut: false, account: initial });
  await change('signedOut', () => true);
  expect(await readStartup()).toEqual({ signedOut: true, account: null });
  await change('signedOut', () => false);
});

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
  // jsdom omits structuredClone; V8 serialization preserves IndexedDB-compatible objects.
  globalThis.structuredClone = (value: any) =>
    require('node:v8').deserialize(require('node:v8').serialize(value));
});

it('persists edits and their outbox atomically, including concurrent edits from two tabs', async () => {
  await change(accountKey(user._id), () => initial);
  await Promise.all([
    change<LocalAccount>(accountKey(user._id), (saved) =>
      enqueue(saved!, [
        {
          kind: 'lists',
          entityId: list._id,
          action: 'patch',
          data: { title: 'Offline title' },
        },
      ]),
    ),
    change<LocalAccount>(accountKey(user._id), (saved) =>
      enqueue(saved!, [
        {
          kind: 'lists',
          entityId: list._id,
          action: 'patch',
          data: { emoji: '🌍' },
        },
      ]),
    ),
  ]);
  const reloaded = await readAccount(user._id);
  expect(reloaded!.lists[0]).toMatchObject({
    title: 'Offline title',
    emoji: '🌍',
    version: 1,
  });
  expect(reloaded!.queue.map((op) => op.baseVersion)).toEqual([0]);
});

it('does not overwrite a pending offline edit with a background snapshot', () => {
  const edited = enqueue(initial, [
    {
      kind: 'lists',
      entityId: list._id,
      action: 'patch',
      data: { title: 'Keep this edit' },
    },
  ]);
  expect(
    mergeSnapshot(edited, {
      lists: [{ ...list, title: 'Server value', version: 7 }],
      tasks: [],
    }).lists[0].title,
  ).toBe('Keep this edit');
});

it('aborts the transaction without losing data when an edit cannot be applied', async () => {
  const before = await readAccount(user._id);
  await expect(
    change<LocalAccount>(accountKey(user._id), (saved) =>
      enqueue(saved!, [
        { kind: 'tasks', entityId: list._id, action: 'patch', data: {} },
      ]),
    ),
  ).rejects.toThrow('no longer available');
  expect(await readAccount(user._id)).toEqual(before);
});

it('does not coalesce a request that may already have reached the server', () => {
  const edited = enqueue(initial, [
    {
      kind: 'lists',
      entityId: list._id,
      action: 'patch',
      data: { title: 'First edit' },
    },
  ]);
  edited.queue[0].sent = true;
  const second = enqueue(edited, [
    {
      kind: 'lists',
      entityId: list._id,
      action: 'patch',
      data: { title: 'Second edit' },
    },
  ]);
  expect(second.queue.map((op) => op.baseVersion)).toEqual([0, 1]);
  expect(second.queue[0].data.title).toBe('First edit');
});

it('keeps pending edits in place even when the server returns a different order', () => {
  const first = { _id: 'a', title: 'First', version: 0 } as Entity;
  const second = { _id: 'b', title: 'Second', version: 0 } as Entity;
  const third = { _id: 'c', title: 'Third', version: 0 } as Entity;
  const edited = enqueue({ ...initial, tasks: [first, second, third] }, [
    {
      kind: 'tasks',
      entityId: 'a',
      action: 'patch',
      data: { title: 'Edited first' },
    },
  ]);
  const merged = mergeSnapshot(edited, {
    lists: [list],
    tasks: [
      third,
      second,
      { ...first, title: 'Remote first' },
      { _id: 'd', title: 'New task', version: 0 } as Entity,
    ],
  });
  expect(merged.tasks.map((task) => task._id)).toEqual(['a', 'b', 'c', 'd']);
  expect(merged.tasks[0].title).toBe('Edited first');
  // Acknowledging the edit must not move it back to a different slot either.
  expect(
    mergeSnapshot(
      { ...merged, queue: [] },
      {
        lists: [list],
        tasks: [third, second, { ...first, title: 'Edited first', version: 1 }],
      },
    ).tasks.map((task) => task._id),
  ).toEqual(['a', 'b', 'c']);
});

it('removes records absent from the server while retaining pending local creations', () => {
  const removed = { _id: 'removed', title: 'Removed', version: 0 } as Entity;
  const account = enqueue({ ...initial, tasks: [removed] }, [
    {
      kind: 'tasks',
      entityId: 'new',
      action: 'create',
      data: { title: 'Offline task' },
    },
  ]);
  expect(
    mergeSnapshot(account, { lists: [list], tasks: [] }).tasks.map(
      (task) => task._id,
    ),
  ).toEqual(['new']);
});

it('blocks list and task mutations locally after archiving without discarding saved contents', () => {
  const task = {
    _id: '64b2f7a9c1e6f9a1b2c3d4e6',
    title: 'Saved task',
    listId: list._id,
    version: 0,
  } as Entity;
  const archived = enqueue({ ...initial, tasks: [task] }, [
    {
      kind: 'lists',
      entityId: list._id,
      action: 'patch',
      data: { archived: true },
    },
  ]);
  expect(archived.tasks[0].title).toBe('Saved task');
  for (const operation of [
    {
      kind: 'lists' as const,
      entityId: list._id,
      action: 'patch' as const,
      data: { title: 'Edit' },
    },
    {
      kind: 'lists' as const,
      entityId: list._id,
      action: 'delete' as const,
      data: {},
    },
    {
      kind: 'tasks' as const,
      entityId: task._id,
      action: 'patch' as const,
      data: { title: 'Edit' },
    },
    {
      kind: 'tasks' as const,
      entityId: '64b2f7a9c1e6f9a1b2c3d4e7',
      action: 'create' as const,
      data: { title: 'New', listId: list._id },
    },
  ])
    expect(() => enqueue(archived, [operation])).toThrow('read only');
});


it('protects Related Tasks offline and permits removing the add-on after deleting the last child', () => {
  const parent = { _id: 'parent', listId: list._id, addons: ['relatedTasks', 'location'], version: 0 } as Entity;
  const child = { _id: 'child', listId: list._id, parentTaskId: 'parent', complete: true, version: 0 } as Entity;
  const account: LocalAccount = { ...initial, tasks: [parent, child] };
  const removeAddon = { kind: 'tasks' as const, entityId: 'parent', action: 'patch' as const, data: { addons: ['location'] } };
  expect(() => enqueue(account, [removeAddon])).toThrow('Remove all related tasks');
  expect(account.tasks[0]).toEqual(parent);
  const next = enqueue(account, [{ kind: 'tasks', entityId: 'child', action: 'delete', data: {} }, removeAddon]);
  expect(next.tasks[0]).toHaveProperty('addons', ['location']);
  expect(next.tasks[1].deleted).toBe(true);
});
