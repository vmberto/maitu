import type { Db, Document } from 'mongodb';
import { ObjectId } from 'mongodb';
import { normalizeLocation } from './location';

import type { Entity, EntityKind, Operation, Snapshot } from './offline/model';

export class SyncError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function objectId(value: unknown) {
  if (typeof value !== 'string' || !/^[a-f0-9]{24}$/i.test(value))
    throw new SyncError('Invalid item ID.');
  return new ObjectId(value);
}
export function collectionName(kind: EntityKind) {
  return kind === 'lists' ? 'lists' : 'todos';
}
export function publicEntity(doc: Document): Entity {
  const fields = new Set([...listFields, ...taskFields, '_id', 'deleted']);
  const data = Object.fromEntries(
    Object.entries(doc).filter(([field]) => fields.has(field)),
  );
  return JSON.parse(JSON.stringify({ ...data, version: doc.version ?? 0 }));
}
export async function ownedList(db: Db, userId: string, listId: string) {
  const list = await db.collection('lists').findOne({
    _id: objectId(listId),
    owner: objectId(userId),
    deleted: { $ne: true },
  });
  if (!list) throw new SyncError('List not found.', 404);
  return list;
}
export async function ownedTask(db: Db, userId: string, taskId: string) {
  const task = await db
    .collection('todos')
    .findOne({ _id: objectId(taskId), deleted: { $ne: true } });
  if (!task) throw new SyncError('Task not found.', 404);
  await ownedList(db, userId, task.listId.toString());
  return task;
}

const listFields = [
  'title',
  'color',
  'emoji',
  'index',
  'createdAt',
  'type',
  'archived',
];
const taskFields = [
  'title',
  'description',
  'complete',
  'completedAt',
  'tags',
  'location',
  'addons',
  'index',
  'createdAt',
  'listId',
  'parentTaskId',
];
export function validateData(
  kind: EntityKind,
  input: Record<string, unknown>,
  create: boolean,
) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new SyncError('Invalid item.');
  const fields = kind === 'lists' ? listFields : taskFields;
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (!(field in input)) continue;
    const value = input[field];
    if (field === 'index') {
      if (!Number.isSafeInteger(value) || (value as number) < 0)
        throw new SyncError('Invalid order.');
    } else if (field === 'archived') {
      if (typeof value !== 'boolean')
        throw new SyncError('Invalid archive status.');
    } else if (field === 'complete') {
      if (typeof value !== 'boolean')
        throw new SyncError('Invalid completion value.');
    } else if (field === 'addons') {
      if (
        !Array.isArray(value) ||
        value.length > 1 ||
        value.some((addon) => addon !== 'location')
      )
        throw new SyncError('Invalid add-ons.');
    } else if (field === 'location') {
      if (
        value === null ||
        (typeof value === 'string' && value.length <= 200)
      ) {
        result[field] = value;
      } else {
        const place = normalizeLocation(value);
        if (!place) throw new SyncError('Invalid location.');
        result[field] = place;
      }
      continue;
    } else if (field === 'tags') {
      if (
        !Array.isArray(value) ||
        value.length > 100 ||
        value.some((tag) => typeof tag !== 'string' || tag.length > 100)
      )
        throw new SyncError('Invalid tags.');
    } else if (field === 'parentTaskId' && value === null) {
      result[field] = null;
      continue;
    } else if (field === 'listId' || field === 'parentTaskId') {
      result[field] = objectId(value);
      continue;
    } else if (field === 'completedAt' && value === null) {
      result[field] = null;
      continue;
    } else if (
      typeof value !== 'string' ||
      value.length >
        (field === 'description' || field === 'title' ? 10000 : 200)
    ) {
      throw new SyncError(`Invalid ${field}.`);
    }
    if (
      ['createdAt', 'completedAt'].includes(field) &&
      typeof value === 'string' &&
      !Number.isFinite(Date.parse(value))
    )
      throw new SyncError('Invalid date.');
    if (field === 'type' && !['tasks', 'timeline'].includes(value as string))
      throw new SyncError('Invalid list type.');
    if (
      field === 'color' &&
      ![
        'primary',
        'redColor',
        'greenColor',
        'pinkColor',
        'yellowColor',
      ].includes(value as string)
    ) {
      throw new SyncError('Invalid color.');
    }
    result[field] = value;
  }
  if (
    create &&
    (typeof result.title !== 'string' ||
      !result.title.trim() ||
      (kind === 'tasks' && !result.listId))
  )
    throw new SyncError('Title and parent list are required.');
  return result;
}

export async function snapshot(db: Db, userId: string): Promise<Snapshot> {
  const lists = await db
    .collection('lists')
    .find({ owner: objectId(userId) })
    .toArray();
  const tasks = await db
    .collection('todos')
    .find({ listId: { $in: lists.map((list) => list._id) } })
    .toArray();
  return { lists: lists.map(publicEntity), tasks: tasks.map(publicEntity) };
}

export async function applyOperation(
  db: Db,
  userId: string,
  operation: Operation,
) {
  if (
    !operation ||
    !['lists', 'tasks'].includes(operation.kind) ||
    !['create', 'patch', 'delete'].includes(operation.action) ||
    typeof operation.id !== 'string' ||
    !/^[a-f0-9-]{36}$/i.test(operation.id) ||
    !Number.isSafeInteger(operation.baseVersion) ||
    operation.baseVersion < 0
  )
    throw new SyncError('Invalid operation.');
  const id = objectId(operation.entityId);
  const owner = objectId(userId);
  const collection = db.collection(collectionName(operation.kind));
  const existing = await collection.findOne({ _id: id });
  let archived = false;
  if (existing) {
    if (operation.kind === 'lists') {
      archived = !!existing.archived;
      if (existing.owner?.toString() !== userId)
        throw new SyncError('Item not found.', 404);
    } else {
      const list = await db
        .collection('lists')
        .findOne({ _id: existing.listId, owner });
      if (!list) throw new SyncError('Item not found.', 404);
      archived = !!list.archived;
      if (list.deleted && operation.action !== 'delete')
        return {
          conflict: {
            message: 'The parent list was deleted on another device.',
            server: { ...publicEntity(existing), deleted: true },
          },
        };
    }
    if (existing._appliedOperations?.includes(operation.id))
      return { entity: publicEntity(existing) };
  }
  if (archived) throw new SyncError('Archived lists are read only.', 403);
  const conflict = (message: string) => ({
    conflict: { message, server: existing ? publicEntity(existing) : null },
  });
  if (operation.action === 'create' && existing)
    return conflict('This item already exists.');
  if (operation.action !== 'create' && (!existing || existing.deleted))
    return conflict('This item was deleted on another device.');
  if ((existing?.version ?? 0) !== operation.baseVersion)
    return conflict('This item changed on another device.');
  const data =
    operation.action === 'delete'
      ? {}
      : validateData(
          operation.kind,
          operation.data,
          operation.action === 'create',
        );
  if (operation.kind === 'tasks' && operation.action !== 'delete') {
    const listId = (data.listId ?? existing?.listId)?.toString();
    const list = await ownedList(db, userId, listId);
    if (list.archived)
      throw new SyncError('Archived lists are read only.', 403);
    if (
      existing &&
      data.listId &&
      data.listId.toString() !== existing.listId.toString()
    )
      throw new SyncError('Moving tasks between lists is not supported.');
    const parentId = data.parentTaskId ?? existing?.parentTaskId;
    if (parentId) {
      const parent = await ownedTask(db, userId, parentId.toString());
      if (
        parent.listId.toString() !== listId ||
        parent.parentTaskId ||
        parent._id.toString() === operation.entityId
      )
        throw new SyncError('Invalid parent task.');
    }
  }
  const updated = { ...data, deleted: operation.action === 'delete' };
  try {
    if (!existing) {
      await collection.insertOne({
        ...updated,
        _id: id,
        owner,
        version: 1,
        _appliedOperations: [operation.id],
      });
    } else {
      const result = await collection.updateOne(
        {
          _id: id,
          ...(operation.kind === 'lists'
            ? { owner, archived: { $ne: true } }
            : { listId: existing.listId }),
          deleted: { $ne: true },
          ...(operation.baseVersion === 0
            ? { $or: [{ version: 0 }, { version: { $exists: false } }] }
            : { version: operation.baseVersion }),
        },
        {
          $set: updated,
          $inc: { version: 1 },
          $addToSet: { _appliedOperations: operation.id },
        },
      );
      if (!result.matchedCount) {
        const current = await collection.findOne({ _id: id });
        if (current?._appliedOperations?.includes(operation.id))
          return { entity: publicEntity(current) };
        return {
          conflict: {
            message: 'This item changed on another device.',
            server: current ? publicEntity(current) : null,
          },
        };
      }
    }
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    const current = await collection.findOne({ _id: id });
    if (current?._appliedOperations?.includes(operation.id))
      return { entity: publicEntity(current) };
    return applyOperation(db, userId, operation);
  }
  // ponytail: receipts stay with each entity; move to a transactional receipt collection if document size becomes material.
  return { entity: publicEntity((await collection.findOne({ _id: id }))!) };
}
