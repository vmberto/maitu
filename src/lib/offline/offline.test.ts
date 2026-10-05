import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';
import { enqueue, mergeSnapshot } from './model';
import type { Entity, LocalAccount } from './model';
import { change, readAccount, accountKey } from './storage';

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
