import type { List, Task, UserObject } from '@/types/main';

export type EntityKind = 'lists' | 'tasks';
export type Entity = (List | Task) & {
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
export type Snapshot = { lists: Entity[]; tasks: Entity[] };
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
  const next = structuredClone(account);
  for (const input of operations) {
    const entities = next[input.kind];
    const index = entities.findIndex((entity) => entity._id === input.entityId);
    const entity = entities[index];
    const parent =
      input.kind === 'lists'
        ? entity
        : next.lists.find(
            (list) =>
              list._id ===
              String((entity as Task | undefined)?.listId ?? input.data.listId),
          );
    if ((parent as List | undefined)?.archived)
      throw new Error('Archived lists are read only.');
    if (input.action !== 'create' && (!entity || entity.deleted))
      throw new Error('This item is no longer available.');
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
      entities[index] = { ...entity, ...input.data } as Entity;
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
    if (index < 0) entities.push(updated);
    else entities[index] = updated;
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
  for (const kind of ['lists', 'tasks'] as const) {
    const pending = new Set(
      account.queue.filter((op) => op.kind === kind).map((op) => op.entityId),
    );
    const remote = new Map(
      snapshot[kind].map((entity) => [entity._id, entity]),
    );
    const seen = new Set(account[kind].map((entity) => entity._id));
    // Replace existing items in place; pending edits must never change their positions.
    next[kind] = [
      ...account[kind].flatMap((entity) => {
        if (pending.has(entity._id)) return [entity];
        const updated = remote.get(entity._id);
        return updated ? [updated] : [];
      }),
      ...snapshot[kind].filter((entity) => !seen.has(entity._id)),
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
