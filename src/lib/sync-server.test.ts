/** @jest-environment node */
import type { Db } from 'mongodb';
import { ObjectId } from 'mongodb';
import { applyOperation, snapshot, validateData } from './sync-server';
import type { Operation } from './offline/model';

const userId = '507f191e810c19729de860ea';
const listId = '64b2f7a9c1e6f9a1b2c3d4e5';
const taskId = '64b2f7a9c1e6f9a1b2c3d4e6';
const receipt = '00000000-0000-4000-8000-000000000001';
const list = {
  _id: new ObjectId(listId),
  owner: new ObjectId(userId),
  title: 'List',
  version: 2,
};
const operation: Operation = {
  id: receipt,
  kind: 'lists',
  entityId: listId,
  action: 'patch',
  baseVersion: 2,
  data: { title: 'Offline edit', owner: 'attacker', _id: taskId },
};
let lists: any;
let tasks: any;
let db: Db;
beforeEach(() => {
  lists = {
    findOne: jest.fn().mockResolvedValue(list),
    updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }),
    insertOne: jest.fn(),
    find: jest
      .fn()
      .mockReturnValue({ toArray: jest.fn().mockResolvedValue([list]) }),
  };
  tasks = {
    findOne: jest.fn().mockResolvedValue(null),
    updateOne: jest.fn(),
    insertOne: jest.fn(),
    find: jest
      .fn()
      .mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
  };
  db = {
    collection: (name: string) => (name === 'lists' ? lists : tasks),
  } as unknown as Db;
});

it('rejects access to another account’s list before mutation', async () => {
  await expect(applyOperation(db, taskId, operation)).rejects.toThrow(
    'not found',
  );
  expect(lists.updateOne).not.toHaveBeenCalled();
});

it('rejects a task creation targeting another account’s list', async () => {
  lists.findOne.mockResolvedValue(null);
  await expect(
    applyOperation(db, userId, {
      ...operation,
      kind: 'tasks',
      entityId: taskId,
      action: 'create',
      baseVersion: 0,
      data: { title: 'Task', listId },
    }),
  ).rejects.toThrow('List not found');
  expect(tasks.insertOne).not.toHaveBeenCalled();
});

it('returns a conflict instead of silently overwriting a newer version', async () => {
  const result = await applyOperation(db, userId, {
    ...operation,
    baseVersion: 1,
  });
  expect(result).toMatchObject({
    conflict: { server: { version: 2, title: 'List' } },
  });
  expect(lists.updateOne).not.toHaveBeenCalled();
});

it('acknowledges an already applied operation after a lost response without applying it twice', async () => {
  lists.findOne.mockResolvedValue({
    ...list,
    version: 9,
    _appliedOperations: [receipt],
  });
  expect(await applyOperation(db, userId, operation)).toMatchObject({
    entity: { version: 9 },
  });
  expect(lists.updateOne).not.toHaveBeenCalled();
});

it('uses an atomic version condition and allowlisted fields', async () => {
  await applyOperation(db, userId, operation);
  expect(lists.updateOne).toHaveBeenCalledWith(
    expect.objectContaining({
      _id: new ObjectId(listId),
      owner: new ObjectId(userId),
      version: 2,
    }),
    {
      $set: { title: 'Offline edit', deleted: false },
      $inc: { version: 1 },
      $addToSet: { _appliedOperations: receipt },
    },
  );
});

it('detects a concurrent update between the read and atomic write', async () => {
  lists.updateOne.mockResolvedValue({ matchedCount: 0 });
  lists.findOne
    .mockResolvedValueOnce(list)
    .mockResolvedValue({ ...list, version: 3, title: 'Concurrent edit' });
  expect(await applyOperation(db, userId, operation)).toMatchObject({
    conflict: { server: { version: 3 } },
  });
});

it('retains a deletion tombstone instead of physically deleting the record', async () => {
  await applyOperation(db, userId, {
    ...operation,
    action: 'delete',
    data: {},
  });
  expect(lists.updateOne.mock.calls[0][1].$set).toEqual({ deleted: true });
});

it('does not resurrect an item deleted by another device', async () => {
  lists.findOne.mockResolvedValue({ ...list, deleted: true });
  expect(await applyOperation(db, userId, operation)).toMatchObject({
    conflict: { server: { deleted: true } },
  });
  expect(lists.updateOne).not.toHaveBeenCalled();
});

it('scopes snapshots by owner and removes private metadata', async () => {
  lists.find.mockReturnValue({
    toArray: async () => [
      {
        ...list,
        _appliedOperations: [receipt],
        password: 'private legacy field',
      },
    ],
  });
  const result = await snapshot(db, userId);
  expect(lists.find).toHaveBeenCalledWith({ owner: new ObjectId(userId) });
  expect(result.lists[0]).not.toHaveProperty('owner');
  expect(result.lists[0]).not.toHaveProperty('_appliedOperations');
  expect(result.lists[0]).not.toHaveProperty('password');
});

it('validates IDs, tags, completion values, and colors at the trust boundary', () => {
  for (const data of [{ listId: 'bad' }, { tags: [5] }, { complete: 'true' }])
    expect(() => validateData('tasks', data, false)).toThrow();
  expect(() => validateData('lists', { color: 'unknown' }, false)).toThrow();
});
