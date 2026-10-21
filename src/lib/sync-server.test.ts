import type { Db } from 'mongodb';
import { ObjectId } from 'mongodb';
import { applyOperation, snapshot, validateData } from './sync-server';
import type { Operation } from './offline/model';

const userId = '507f191e810c19729de860ea';
const listId = '64b2f7a9c1e6f9a1b2c3d4e5';
const taskId = '64b2f7a9c1e6f9a1b2c3d4e6';
const receipt = '00000000-0000-4000-8000-000000000001';
it('rejects scheduling notes and permits scheduling related tasks in a Notes list', async () => {
  lists.findOne.mockResolvedValue({ ...list, type: 'notes' });
  const schedule = { date: '2026-10-21', timeZone: 'America/Recife' };
  const existing = { _id: new ObjectId(taskId), listId: new ObjectId(listId), version: 2 };
  tasks.findOne.mockResolvedValue({ ...existing, type: 'note' });
  const edit = { ...operation, kind: 'tasks' as const, entityId: taskId, data: { schedule } };
  await expect(applyOperation(db, userId, edit)).rejects.toThrow('Only tasks');
  const parentId = '64b2f7a9c1e6f9a1b2c3d4ef';
  tasks.findOne.mockImplementation(async (filter: { _id: ObjectId }) => filter._id.toString() === parentId
    ? { _id: new ObjectId(parentId), listId: new ObjectId(listId), type: 'note' }
    : { ...existing, parentTaskId: new ObjectId(parentId) });
  tasks.updateOne.mockResolvedValue({ matchedCount: 1 });
  await applyOperation(db, userId, edit);
  expect(tasks.updateOne.mock.calls[0][1].$set.schedule).toEqual(schedule);
});
it('moves a task only into an owned active list', async () => {
  const destination = '64b2f7a9c1e6f9a1b2c3d4e7';
  const existing = { _id: new ObjectId(taskId), listId: new ObjectId(listId), version: 2 };
  tasks.findOne.mockResolvedValue(existing);
  tasks.updateOne.mockResolvedValue({ matchedCount: 1 });
  await applyOperation(db, userId, { ...operation, kind: 'tasks', entityId: taskId, data: { listId: destination } });
  expect(tasks.updateOne.mock.calls[0][1].$set.listId.toString()).toBe(destination);
  lists.findOne.mockResolvedValue(null);
  await expect(applyOperation(db, userId, { ...operation, kind: 'tasks', entityId: taskId, data: { listId: destination } })).rejects.toThrow('not found');
});
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
let folders: any;
let db: Db;
beforeEach(() => {
  lists = {
    findOne: vi.fn().mockResolvedValue(list),
    updateOne: vi.fn().mockResolvedValue({ matchedCount: 1 }),
    insertOne: vi.fn(),
    find: vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([list]) }),
  };
  tasks = {
    findOne: vi.fn().mockResolvedValue(null),
    updateOne: vi.fn(),
    insertOne: vi.fn(),
    find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
  };
  folders = {
    findOne: vi.fn().mockResolvedValue(null),
    updateOne: vi.fn().mockResolvedValue({ matchedCount: 1 }),
    insertOne: vi.fn(),
    find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
  };
  db = {
    collection: (name: string) => (name === 'lists' ? lists : name === 'folders' ? folders : tasks),
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

it('validates structured locations while preserving legacy text and allowing removal', () => {
  const location = {
    name: 'Restaurant X',
    address: 'Recife, Brazil',
    latitude: -8.063,
    longitude: -34.881,
    source: 'openstreetmap',
    placeId: 'N123',
  };
  expect(
    validateData(
      'tasks',
      { location: { ...location, owner: 'ignored' } },
      false,
    ),
  ).toEqual({ location });
  expect(validateData('tasks', { location: null }, false)).toEqual({
    location: null,
  });
  expect(validateData('tasks', { location: 'Legacy address' }, false)).toEqual({
    location: 'Legacy address',
  });
  for (const patch of [
    { latitude: 91 },
    { longitude: -181 },
    { latitude: NaN },
    { longitude: Infinity },
    { latitude: '8' },
    { name: '' },
    { address: 'x'.repeat(1001) },
    { source: 'unknown' },
    { placeId: 'bad' },
  ]) {
    expect(() =>
      validateData('tasks', { location: { ...location, ...patch } }, false),
    ).toThrow('Invalid location');
  }
});

it('persists only supported add-ons and allows removing them', () => {
  expect(validateData('tasks', { addons: ['location'] }, false)).toEqual({
    addons: ['location'],
  });
  expect(validateData('tasks', { addons: [] }, false)).toEqual({ addons: [] });
  const addons = ['location', 'relatedTasks', 'scheduling'];
  expect(validateData('tasks', { addons }, false)).toEqual({ addons });
  expect(validateData('tasks', { addons: ['location', 'relatedTasks'] }, false)).toEqual({ addons: ['location', 'relatedTasks'] });
  for (const addons of ['location', ['unknown'], ['location', 'location']])
    expect(() => validateData('tasks', { addons }, false)).toThrow(
      'Invalid add-ons',
    );
});

it('accepts manual coordinates including zero and rejects invalid manual points', () => {
  const location = {
    name: 'Manual pin',
    address: '',
    latitude: 0,
    longitude: 0,
    source: 'manual',
    placeId: 'manual',
  };
  expect(validateData('tasks', { location }, false)).toEqual({ location });
  for (const patch of [
    { latitude: 91 },
    { longitude: -181 },
    { latitude: NaN },
    { placeId: 'N123' },
  ])
    expect(() =>
      validateData('tasks', { location: { ...location, ...patch } }, false),
    ).toThrow('Invalid location');
});

it('archives a list, preserves archive receipts and rejects later mutations', async () => {
  expect(validateData('lists', { archived: true }, false)).toEqual({
    archived: true,
  });
  await applyOperation(db, userId, { ...operation, data: { archived: true } });
  expect(lists.updateOne).toHaveBeenCalledWith(
    expect.objectContaining({ archived: { $ne: true } }),
    expect.objectContaining({ $set: { archived: true, deleted: false } }),
  );
  lists.findOne.mockResolvedValue({ ...list, archived: true });
  await expect(applyOperation(db, userId, operation)).rejects.toThrow(
    'read only',
  );
  await expect(
    applyOperation(db, userId, {
      ...operation,
      kind: 'tasks',
      entityId: taskId,
      action: 'create',
      baseVersion: 0,
      data: { title: 'Task', listId },
    }),
  ).rejects.toThrow('read only');
  lists.findOne.mockResolvedValue({
    ...list,
    archived: true,
    _appliedOperations: [receipt],
  });
  expect(await applyOperation(db, userId, operation)).toHaveProperty(
    'entity.archived',
    true,
  );
});

it('rejects editing and deleting tasks within archived lists', async () => {
  lists.findOne.mockResolvedValue({ ...list, archived: true });
  tasks.findOne.mockResolvedValue({
    _id: new ObjectId(taskId),
    listId: new ObjectId(listId),
    version: 2,
  });
  for (const action of ['patch', 'delete'] as const)
    await expect(
      applyOperation(db, userId, {
        ...operation,
        kind: 'tasks',
        entityId: taskId,
        action,
      }),
    ).rejects.toThrow('read only');
  expect(tasks.updateOne).not.toHaveBeenCalled();
});


it('accepts the mixed list type and validates entry types and archive flags', () => {
  for (const type of ['tasks', 'places', 'notes', 'mixed', 'timeline'])
    expect(validateData('lists', { type }, false)).toEqual({ type });
  expect(validateData('tasks', { type: 'note', archived: true }, false)).toEqual({ type: 'note', archived: true });
  for (const data of [{ type: 'topic' }, { archived: 'true' }])
    expect(() => validateData('tasks', data, false)).toThrow();
});

it('converts completed tasks into notes and rejects completing or nesting notes', async () => {
  tasks.findOne.mockResolvedValue({ _id: new ObjectId(taskId), listId: new ObjectId(listId), complete: true, completedAt: '2026-01-01', version: 2 });
  tasks.updateOne.mockResolvedValue({ matchedCount: 1 });
  const patch = { ...operation, kind: 'tasks' as const, entityId: taskId, data: { type: 'note' } };
  await applyOperation(db, userId, patch);
  expect(tasks.updateOne.mock.calls[0][1].$set).toMatchObject({ type: 'note', complete: false, completedAt: null });
  tasks.findOne.mockResolvedValue({ _id: new ObjectId(taskId), listId: new ObjectId(listId), type: 'note', version: 2 });
  await expect(applyOperation(db, userId, { ...patch, data: { complete: true } })).rejects.toThrow('Notes cannot be completed');
  await expect(applyOperation(db, userId, { ...patch, data: { parentTaskId: listId } })).rejects.toThrow('Notes cannot be subtasks');
});

it('archives and restores notes and tasks', async () => {
  tasks.findOne.mockResolvedValue({ _id: new ObjectId(taskId), listId: new ObjectId(listId), type: 'note', version: 2 });
  tasks.updateOne.mockResolvedValue({ matchedCount: 1 });
  const patch = { ...operation, kind: 'tasks' as const, entityId: taskId, data: { archived: true } };
  await applyOperation(db, userId, patch);
  expect(tasks.updateOne.mock.calls[0][1].$set).toMatchObject({ archived: true });
  tasks.findOne.mockResolvedValue({ _id: new ObjectId(taskId), listId: new ObjectId(listId), type: 'note', archived: true, version: 2 });
  await applyOperation(db, userId, { ...patch, data: { archived: false } });
  expect(tasks.updateOne.mock.calls[1][1].$set).toMatchObject({ archived: false });
  tasks.findOne.mockResolvedValue({ _id: new ObjectId(taskId), listId: new ObjectId(listId), version: 2 });
  await applyOperation(db, userId, patch);
  expect(tasks.updateOne.mock.calls[2][1].$set).toMatchObject({ archived: true });
  await applyOperation(db, userId, { ...patch, data: { archived: false } });
  expect(tasks.updateOne.mock.calls[3][1].$set).toMatchObject({ archived: false });
});


it('detaches a related task when it is moved independently to another list', async () => {
  tasks.findOne.mockResolvedValue({ _id: new ObjectId(taskId), listId: new ObjectId(listId), parentTaskId: new ObjectId('64b2f7a9c1e6f9a1b2c3d4e8'), version: 2 });
  tasks.updateOne.mockResolvedValue({ matchedCount: 1 });
  await applyOperation(db, userId, { ...operation, kind: 'tasks', entityId: taskId, data: { listId: '64b2f7a9c1e6f9a1b2c3d4e7', parentTaskId: null } });
  expect(tasks.updateOne.mock.calls[0][1].$set.parentTaskId).toBeNull();
  expect(tasks.findOne).toHaveBeenCalledTimes(2);
});


it('rejects removing Related Tasks while children remain, including completed children', async () => {
  const parent = { _id: new ObjectId(taskId), listId: new ObjectId(listId), addons: ['relatedTasks', 'location'], version: 2 };
  tasks.findOne.mockResolvedValueOnce(parent).mockResolvedValueOnce({ parentTaskId: parent._id, complete: true });
  await expect(applyOperation(db, userId, { ...operation, kind: 'tasks', entityId: taskId, data: { addons: ['location'] } })).rejects.toThrow('Remove all related tasks');
  expect(tasks.findOne).toHaveBeenLastCalledWith({ parentTaskId: parent._id, deleted: { $ne: true } });
  expect(tasks.updateOne).not.toHaveBeenCalled();
});

it('allows removing an empty Related Tasks add-on without losing Location', async () => {
  const parent = { _id: new ObjectId(taskId), listId: new ObjectId(listId), addons: ['relatedTasks', 'location'], version: 2 };
  tasks.findOne.mockResolvedValueOnce(parent).mockResolvedValueOnce(null).mockResolvedValueOnce(parent);
  tasks.updateOne.mockResolvedValue({ matchedCount: 1 });
  await applyOperation(db, userId, { ...operation, kind: 'tasks', entityId: taskId, data: { addons: ['location'] } });
  expect(tasks.updateOne.mock.calls[0][1].$set.addons).toEqual(['location']);
});

it('rejects changing a list to a type incompatible with its saved items', async () => {
  const convert = (type: string) => ({ ...operation, data: { type } });
  tasks.find.mockReturnValue({ toArray: vi.fn().mockResolvedValue([{ type: 'task', archived: true, complete: true }]) });
  await expect(applyOperation(db, userId, convert('notes'))).rejects.toThrow('Remove all tasks');
  expect(lists.updateOne).not.toHaveBeenCalled();
  await applyOperation(db, userId, convert('mixed'));
  tasks.find.mockReturnValue({ toArray: vi.fn().mockResolvedValue([{ type: 'note', archived: true }]) });
  lists.findOne.mockResolvedValue({ ...list, type: 'mixed' });
  await expect(applyOperation(db, userId, convert('tasks'))).rejects.toThrow('Remove all notes');
  tasks.find.mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });
  await applyOperation(db, userId, convert('tasks'));
});

it('preserves legacy Notes entries when converting their list to Tasks & Notes', async () => {
  lists.findOne.mockResolvedValue({ ...list, type: 'timeline' });
  tasks.find.mockReturnValue({ toArray: vi.fn().mockResolvedValue([{ title: 'Legacy note' }]) });
  tasks.updateMany = vi.fn().mockResolvedValue({ modifiedCount: 1 });
  await expect(applyOperation(db, userId, { ...operation, data: { type: 'tasks' } })).rejects.toThrow('Remove all notes');
  await applyOperation(db, userId, { ...operation, data: { type: 'mixed' } });
  expect(tasks.updateMany).toHaveBeenCalledWith(expect.objectContaining({ type: { $exists: false } }), { $set: { type: 'note' } });
});

it('rejects converting an existing list to Timeline even when empty', async () => {
  for (const type of ['tasks', 'notes', 'mixed']) {
    lists.findOne.mockResolvedValue({ ...list, type });
    await expect(applyOperation(db, userId, { ...operation, data: { type: 'timeline' } })).rejects.toThrow('Timeline must be selected when creating');
  }
  expect(lists.updateOne).not.toHaveBeenCalled();
});

it('preserves scheduling history after removing a date and accepts coalesced history', async () => {
  tasks.findOne.mockResolvedValue({ _id: new ObjectId(taskId), listId: new ObjectId(listId), schedule: { date: '2026-10-20', timeZone: 'America/Recife' }, version: 2 });
  tasks.updateOne.mockResolvedValue({ matchedCount: 1 });
  await applyOperation(db, userId, { ...operation, kind: 'tasks', entityId: taskId, data: { schedule: null } });
  expect(tasks.updateOne.mock.calls[0][1].$set).toMatchObject({ schedule: null, wasScheduled: true });
  expect(validateData('tasks', { schedule: null, wasScheduled: true }, false)).toMatchObject({ schedule: null, wasScheduled: true });
  expect(() => validateData('tasks', { wasScheduled: false }, false)).toThrow('Invalid scheduling history');
});


it('defaults new Places tasks to Location without overriding explicit add-ons', async () => {
  lists.findOne.mockResolvedValue({ ...list, type: 'places' });
  tasks.insertOne.mockImplementation(async (doc: unknown) => { tasks.findOne.mockResolvedValue(doc); });
  const create = { ...operation, kind: 'tasks' as const, entityId: taskId, action: 'create' as const, baseVersion: 0, data: { title: 'Museum', listId } };
  await applyOperation(db, userId, create);
  expect(tasks.insertOne.mock.calls[0][0]).toMatchObject({ title: 'Museum', addons: ['location'] });
  tasks.findOne.mockResolvedValue(null);
  await applyOperation(db, userId, { ...create, data: { ...create.data, addons: [] } });
  expect(tasks.insertOne.mock.calls[1][0]).toHaveProperty('addons', []);
});

it('rejects converting a list with notes into Places', async () => {
  lists.findOne.mockResolvedValue({ ...list, type: 'mixed' });
  tasks.find.mockReturnValue({ toArray: async () => [{ type: 'note' }] });
  await expect(applyOperation(db, userId, { ...operation, data: { type: 'places' } })).rejects.toThrow('Remove all notes');
});


it('validates folder names and folder assignments', () => {
  for (const title of ['', '   ', 'a'.repeat(51), 123])
    expect(() => validateData('folders', { title }, true)).toThrow();
  expect(validateData('folders', { title: 'Work', owner: userId }, true)).toEqual({ title: 'Work' });
  expect(() => validateData('lists', { folderId: 'bad' }, false)).toThrow();
  expect(validateData('lists', { folderId: null }, false)).toEqual({ folderId: null });
});

it('creates owned folders, includes them in snapshots, and hides private metadata', async () => {
  const folder = { _id: new ObjectId(taskId), title: 'Work', owner: new ObjectId(userId), version: 1 };
  folders.findOne.mockResolvedValueOnce(null).mockResolvedValue(folder);
  const result = await applyOperation(db, userId, { ...operation, kind: 'folders', entityId: taskId, action: 'create', baseVersion: 0, data: { title: 'Work' } });
  expect(folders.insertOne).toHaveBeenCalledWith(expect.objectContaining({ title: 'Work', owner: new ObjectId(userId) }));
  expect(result).toMatchObject({ entity: { title: 'Work', version: 1 } });
  folders.find.mockReturnValue({ toArray: async () => [folder] });
  expect((await snapshot(db, userId)).folders).toEqual([{ _id: taskId, title: 'Work', version: 1 }]);
  expect(folders.find).toHaveBeenCalledWith({ owner: new ObjectId(userId) });
  await expect(applyOperation(db, listId, { ...operation, kind: 'folders', entityId: taskId })).rejects.toThrow('not found');
  expect(folders.updateOne).not.toHaveBeenCalled();
});

it('assigns lists only to owned live folders and allows removing assignments', async () => {
  const edit = { ...operation, data: { folderId: taskId } };
  await expect(applyOperation(db, userId, edit)).rejects.toThrow('Folder not found');
  expect(folders.findOne).toHaveBeenCalledWith({ _id: new ObjectId(taskId), owner: new ObjectId(userId), deleted: { $ne: true } });
  expect(lists.updateOne).not.toHaveBeenCalled();
  folders.findOne.mockResolvedValue({ _id: new ObjectId(taskId), owner: new ObjectId(userId) });
  await applyOperation(db, userId, edit);
  expect(lists.updateOne.mock.calls[0][1].$set.folderId).toBe(taskId);
  await applyOperation(db, userId, { ...operation, data: { folderId: null } });
  expect(lists.updateOne.mock.calls[1][1].$set.folderId).toBeNull();
});


it('unfiles archived lists without permitting content changes or removing archive protection', async () => {
  lists.findOne.mockResolvedValue({ ...list, archived: true, folderId: taskId });
  await applyOperation(db, userId, { ...operation, data: { folderId: null } });
  expect(lists.updateOne.mock.calls[0][1].$set).toEqual({ folderId: null, deleted: false });
  expect(lists.updateOne.mock.calls[0][0]).not.toHaveProperty('archived');
  await expect(applyOperation(db, userId, { ...operation, data: { folderId: null, title: 'Changed' } })).rejects.toThrow('read only');
  await expect(applyOperation(db, taskId, { ...operation, data: { folderId: null } })).rejects.toThrow('not found');
});

it('requires member lists to be unfiled before deleting an owned folder', async () => {
  folders.findOne.mockResolvedValue({ _id: new ObjectId(taskId), owner: new ObjectId(userId), version: 2, title: 'Work' });
  const remove = { ...operation, kind: 'folders' as const, entityId: taskId, action: 'delete' as const, data: {} };
  await expect(applyOperation(db, userId, remove)).rejects.toThrow('Move lists out');
  expect(lists.findOne).toHaveBeenCalledWith({ owner: new ObjectId(userId), folderId: taskId, deleted: { $ne: true } });
  expect(folders.updateOne).not.toHaveBeenCalled();
  lists.findOne.mockResolvedValue(null);
  await applyOperation(db, userId, remove);
  expect(folders.updateOne.mock.calls[0][1].$set).toEqual({ deleted: true });
});

it('rejects recurring notes and clears recurrence when converting a task to a note', async () => {
  const recurrence = { dayOfMonth: 31, nextDate: '2026-10-31', timeZone: 'America/Recife' };
  const existing = { _id: new ObjectId(taskId), listId: new ObjectId(listId), version: 2, recurrence };
  lists.findOne.mockResolvedValue({ ...list, type: 'mixed' });
  tasks.findOne.mockResolvedValue({ ...existing, type: 'note' });
  const edit = { ...operation, kind: 'tasks' as const, entityId: taskId, data: { recurrence } };
  await expect(applyOperation(db, userId, edit)).rejects.toThrow('Only tasks can recur');
  tasks.findOne.mockResolvedValue(existing);
  tasks.updateOne.mockResolvedValue({ matchedCount: 1 });
  await applyOperation(db, userId, { ...edit, data: { type: 'note' } });
  expect(tasks.updateOne.mock.calls[0][1].$set.recurrence).toBeNull();
});
