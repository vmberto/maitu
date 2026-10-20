import type { Folder, List, Task, UserObject } from '../../../types/main';
import { entryType, listTypeError } from '../list-types';

export type EntityKind = 'lists' | 'tasks' | 'folders';
export type Entity = (List | Task | Folder) & {
  _id: string;
  version: number;
  deleted?: boolean;
};
export type Operation = {
  id: string;
  kind: EntityKind;
  entityId: string;
  baseVersion: number;
  action: 'create' | 'patch' | 'delete';
  data: Record<string, unknown>;
  sent?: boolean;
  conflict?: { server: Entity | null; message: string };
};
export type Snapshot = { lists: Entity[]; tasks: Entity[]; folders?: Entity[] };
export type LocalAccount = Snapshot & {
  user: UserObject;
  queue: Operation[];
  lastSync?: string;
};

// ObjectId-compatible IDs can be created offline without changing existing MongoDB relations.
export function newId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}

export function enqueue(
  account: LocalAccount,
  operations: Omit<Operation, 'id' | 'baseVersion'>[],
): LocalAccount {
  let next = structuredClone(account);
  for (const input of operations) {
    const entities = input.kind === 'folders' ? (next.folders ??= []) : next[input.kind];
    const index = entities.findIndex((entity) => entity._id === input.entityId);
    const entity = entities[index];
    const parent =
      input.kind === 'lists'
        ? entity
        : input.kind === 'folders' ? undefined : next.lists.find(
            (list) =>
              list._id ===
              String((entity as Task | undefined)?.listId ?? input.data.listId),
          );
    // Folder deletion may detach archived lists without editing their contents.
    const unfiling = input.kind === 'lists' && input.action === 'patch' && input.data.folderId === null && Object.keys(input.data).length === 1;
    if ((parent as List | undefined)?.archived && !unfiling)
      throw new Error('Archived lists are read only.');
    if (input.action !== 'create' && (!entity || entity.deleted))
      throw new Error('This item is no longer available.');
    if (input.kind === 'tasks' && input.action !== 'delete') {
      if ((parent as List | undefined)?.type === 'places' && input.action === 'create' && input.data.addons === undefined)
        input.data = { ...input.data, addons: ['location'] };
      const nextTask = { ...entity, ...input.data } as Task;
      if (nextTask.wasScheduled || nextTask.schedule || (entity as Task | undefined)?.wasScheduled || (entity as Task | undefined)?.schedule)
        input.data = { ...input.data, wasScheduled: true };
      if (nextTask.type === 'note' || (!nextTask.parentTaskId && ['notes', 'timeline'].includes((parent as List | undefined)?.type ?? ''))) {
        if (input.data.schedule || input.data.reminder) throw new Error('Only tasks can be scheduled.');
        if (nextTask.schedule || nextTask.reminder) input.data = { ...input.data, schedule: null, reminder: null };
      }
    }
    if (input.kind === 'lists' && input.action === 'patch' && typeof input.data.type === 'string') {
      const currentType = (entity as List).type ?? 'tasks';
      const items = next.tasks.filter((item) => !item.deleted && String((item as Task).listId) === input.entityId);
      const error = listTypeError(items as Task[], currentType, input.data.type);
      if (error) throw new Error(error);
      if (['notes', 'timeline'].includes(currentType) && input.data.type !== currentType) {
        next = enqueue(next, items.filter((item) => !(item as Task).type).map((item) => ({
          kind: 'tasks', entityId: item._id, action: 'patch', data: { type: entryType(item as Task, currentType) },
        })));
      }
    }
    if (input.kind === 'tasks' && (entity as Task | undefined)?.addons?.includes('relatedTasks') &&
      Array.isArray(input.data.addons) && !input.data.addons.includes('relatedTasks') &&
      next.tasks.some((task) => !task.deleted && String((task as Task).parentTaskId) === input.entityId))
      throw new Error('Remove all related tasks before removing this add-on.');
    const last = next.queue[next.queue.length - 1];
    // Coalesce only operations that have never been sent. Retried requests must stay immutable.
    if (
      input.action === 'patch' &&
      last &&
      !last.sent &&
      !last.conflict &&
      last.action !== 'delete' &&
      last.kind === input.kind &&
      last.entityId === input.entityId
    ) {
      last.data = { ...last.data, ...input.data };
      next[input.kind]![index] = { ...entity, ...input.data } as Entity;
      continue;
    }
    const operation: Operation = {
      ...input,
      id: crypto.randomUUID(),
      baseVersion: entity?.version ?? 0,
    };
    const updated = {
      ...entity,
      ...input.data,
      _id: input.entityId,
      version: operation.baseVersion + 1,
      deleted: input.action === 'delete',
    } as Entity;
    if (index < 0) next[input.kind]!.push(updated);
    else next[input.kind]![index] = updated;
    next.queue.push(operation);
  }
  return next;
}

// Pending local changes always win over a background snapshot until explicitly resolved.
export function mergeSnapshot(
  account: LocalAccount,
  snapshot: Snapshot,
): LocalAccount {
  const next = { ...account };
  for (const kind of ['lists', 'tasks', 'folders'] as const) {
    const pending = new Set(
      account.queue.filter((op) => op.kind === kind).map((op) => op.entityId),
    );
    const remote = new Map(
      (snapshot[kind] ?? []).map((entity) => [entity._id, entity]),
    );
    const seen = new Set((account[kind] ?? []).map((entity) => entity._id));
    // Replace existing items in place; pending edits must never change their positions.
    next[kind] = [
      ...(account[kind] ?? []).flatMap((entity) => {
        if (pending.has(entity._id)) return [entity];
        const updated = remote.get(entity._id);
        return updated ? [updated] : [];
      }),
      ...(snapshot[kind] ?? []).filter((entity) => !seen.has(entity._id)),
    ];
  }
  return next;
}

// Only retire caches used by the old PWA; preserve unrelated same-origin caches.
export function isLegacyCache(name: string) {
  return (
    name.startsWith('serwist-') ||
    name.startsWith('workbox-') ||
    [
      'pages',
      'pages-rsc',
      'pages-rsc-prefetch',
      'apis',
      'next-data',
      'static-data-assets',
      'others',
    ].includes(name)
  );
}
