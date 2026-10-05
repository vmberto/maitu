'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import {
  accountKey,
  change,
  clearActiveAccount,
  read,
  readAccount,
} from '@/src/lib/offline/storage';
import {
  enqueue,
  isLegacyCache,
  mergeSnapshot,
  newId,
} from '@/src/lib/offline/model';
import type {
  Entity,
  EntityKind,
  LocalAccount,
  Operation,
  Snapshot,
} from '@/src/lib/offline/model';
import type { List, Task, UserObject } from '@/types/main';

type InputOperation = Omit<Operation, 'id' | 'baseVersion'>;
type OfflineContextValue = {
  account: LocalAccount | null;
  commit: (
    build: (account: LocalAccount) => InputOperation[],
  ) => Promise<LocalAccount>;
  add: (kind: EntityKind, data: List | Task) => Promise<Entity>;
  update: (
    kind: EntityKind,
    id: string,
    data: Partial<List & Task>,
  ) => Promise<void>;
  remove: (kind: EntityKind, id: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  exportData: () => void;
  status: string;
};
const OfflineContext = createContext<OfflineContextValue | null>(null);
export function useOffline() {
  const value = useContext(OfflineContext);
  if (!value) throw new Error('OfflineProvider is required.');
  return value;
}

class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request(path: string, options?: RequestInit) {
  const response = await fetch(path, {
    ...options,
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 401)
    throw new Error('Sign in to sync. Your changes are saved on this device.');
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new HttpError(
      body?.error ??
        'Could not connect. Your changes are saved on this device.',
      response.status,
    );
  }
  return response.json();
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Opening device data…');
  const [online, setOnline] = useState(true);
  const [storageError, setStorageError] = useState('');
  const [updateWaiting, setUpdateWaiting] = useState<ServiceWorker | null>(
    null,
  );
  const current = useRef<LocalAccount | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  const syncing = useRef(false);
  const saving = useRef(0);
  const stopped = useRef(false);
  const retry = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const syncRef = useRef<(manual?: boolean) => Promise<void>>(async () => {});

  function publish(next: LocalAccount | null, broadcast = true) {
    current.current = next;
    setAccount(next);
    if (broadcast) channel.current?.postMessage('changed');
  }

  async function save(
    userId: string,
    update: (saved: LocalAccount) => LocalAccount,
  ) {
    try {
      const next = await change<LocalAccount>(accountKey(userId), (saved) => {
        if (!saved) throw new Error('Sign in before editing.');
        return update(saved);
      });
      if (current.current?.user._id === userId) publish(next);
      setStorageError('');
      return next;
    } catch (error) {
      setStorageError(
        'This change could not be saved on your device. Free some storage and try again.',
      );
      throw error;
    }
  }

  async function commit(build: (saved: LocalAccount) => InputOperation[]) {
    const userId = current.current?.user._id?.toString();
    if (!userId || stopped.current) throw new Error('Sign in before editing.');
    saving.current += 1;
    setStatus('Saving on device…');
    let next;
    try {
      next = await save(userId, (saved) => enqueue(saved, build(saved)));
    } finally {
      saving.current -= 1;
    }
    setStatus(
      saving.current
        ? 'Saving on device…'
        : 'Saved on device. Waiting to sync.',
    );
    clearTimeout(retry.current);
    retry.current = setTimeout(() => {
      void syncRef.current();
    }, 500);
    return next;
  }

  async function sync(manual = false) {
    setOnline(navigator.onLine);
    if (syncing.current || stopped.current || !navigator.onLine) {
      if (!navigator.onLine)
        setStatus('Offline. Changes are saved on this device.');
      return;
    }
    syncing.current = true;
    let completed = false;
    try {
      if (manual) setStatus('Syncing…');
      const { user }: { user: UserObject } = await request('/api/session');
      if (stopped.current) return;
      const userId = user._id!.toString();
      if (current.current?.user._id !== userId) {
        const loaded = await change<LocalAccount>(
          accountKey(userId),
          (saved) =>
            saved
              ? { ...saved, user }
              : { user, lists: [], tasks: [], queue: [] },
        );
        await change<string>('active', () => userId);
        publish(loaded);
      }
      const run = async () => {
        while (!stopped.current && current.current?.user._id === userId) {
          const saved = await readAccount(userId);
          if (!saved?.queue[0] || saved.queue[0].conflict) break;
          const prepared = await save(userId, (latest) => ({
            ...latest,
            queue: latest.queue.map((op, index) =>
              index === 0 ? { ...op, sent: true } : op,
            ),
          }));
          const operation = prepared.queue[0];
          if (!operation || operation.conflict) break;
          let result;
          try {
            result = await request('/api/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Maitu-Account': userId,
              },
              body: JSON.stringify(operation),
            });
          } catch (error) {
            if (
              !(error instanceof HttpError) ||
              ![400, 404, 413].includes(error.status)
            )
              throw error;
            result = { conflict: { message: error.message, server: null } };
          }
          await save(userId, (latest) => {
            if (result.conflict)
              return {
                ...latest,
                queue: latest.queue.map((op) =>
                  op.id === operation.id
                    ? { ...op, conflict: result.conflict }
                    : op,
                ),
              };
            const next = {
              ...latest,
              queue: latest.queue.filter((op) => op.id !== operation.id),
            };
            // A later local edit must not be replaced by the acknowledgement of an earlier edit.
            if (
              !next.queue.some(
                (op) =>
                  op.kind === operation.kind &&
                  op.entityId === operation.entityId,
              )
            ) {
              next[operation.kind] = next[operation.kind].map((item) =>
                item._id === operation.entityId ? result.entity : item,
              );
            }
            return next;
          });
          if (result.conflict) break;
        }
        if (stopped.current || current.current?.user._id !== userId) return;
        const remote: Snapshot = await request('/api/sync', {
          headers: { 'X-Maitu-Account': userId },
        });
        await save(userId, (saved) => ({
          ...mergeSnapshot(saved, remote),
          lastSync: new Date().toISOString(),
        }));
      };
      if (navigator.locks)
        await navigator.locks.request(`maitu-sync:${userId}`, run);
      else await run(); // Atomic server receipts still make repeated sends safe without Web Locks.
      completed = true;
      if (!stopped.current)
        setStatus(
          current.current?.queue.some((op) => op.conflict)
            ? 'Saved on device. Some changes need attention.'
            : current.current?.queue.length
              ? 'Saved on device. Waiting to sync.'
              : 'All changes synced.',
        );
    } catch (error) {
      if (!stopped.current) {
        setStatus(
          error instanceof Error && error.message.startsWith('Sign in')
            ? error.message
            : 'Could not sync. Changes stay saved on this device.',
        );
        if (
          !current.current &&
          error instanceof Error &&
          error.message.startsWith('Sign in')
        )
          window.location.replace('/login');
      }
    } finally {
      syncing.current = false;
      // Edits made during a snapshot fetch may miss their debounce; flush them promptly.
      if (
        completed &&
        !stopped.current &&
        current.current?.queue[0] &&
        !current.current.queue[0].conflict
      ) {
        clearTimeout(retry.current);
        retry.current = setTimeout(() => {
          void syncRef.current();
        }, 500);
      }
    }
  }
  useEffect(() => {
    syncRef.current = sync;
  });

  useEffect(() => {
    stopped.current = false;
    if ('BroadcastChannel' in window) {
      channel.current = new BroadcastChannel('maitu-offline');
      channel.current.onmessage = async () => {
        const active = await read<string | null>('active');
        publish(active ? ((await readAccount(active)) ?? null) : null, false);
        if (!active) {
          stopped.current = true;
          window.location.replace('/login');
        }
      };
    }
    void (async () => {
      try {
        if (await read<boolean>('signedOut')) {
          stopped.current = true;
          window.location.replace('/login');
          setReady(true);
          return;
        }
        const active = await read<string>('active');
        if (active && !stopped.current)
          publish((await readAccount(active)) ?? null, false);
        setReady(true);
        await syncRef.current();
      } catch {
        setStorageError(
          'Device storage is unavailable. Enable storage to use Maitu offline.',
        );
        setReady(true);
      }
    })();
    let registration: ServiceWorkerRegistration | undefined;
    const checkUpdate = () => {
      if (registration?.waiting) setUpdateWaiting(registration.waiting);
    };
    const updateFound = () => {
      const worker = registration?.installing;
      worker?.addEventListener('statechange', checkUpdate);
    };
    if ('serviceWorker' in navigator)
      void navigator.serviceWorker.ready.then((value) => {
        if (stopped.current) return;
        registration = value;
        checkUpdate();
        registration.addEventListener('updatefound', updateFound);
      });
    const trigger = () => {
      if (document.visibilityState === 'visible') void syncRef.current();
    };
    const offline = () => {
      setOnline(false);
      setStatus('Offline. Changes are saved on this device.');
    };
    window.addEventListener('online', trigger);
    window.addEventListener('offline', offline);
    window.addEventListener('focus', trigger);
    document.addEventListener('visibilitychange', trigger);
    const interval = setInterval(trigger, 30000);
    void navigator.storage?.persist?.().catch(() => false);
    return () => {
      stopped.current = true;
      clearTimeout(retry.current);
      clearInterval(interval);
      channel.current?.close();
      registration?.removeEventListener('updatefound', updateFound);
      window.removeEventListener('online', trigger);
      window.removeEventListener('offline', offline);
      window.removeEventListener('focus', trigger);
      document.removeEventListener('visibilitychange', trigger);
    };
  }, []);

  async function resolve(operation: Operation, keepLocal: boolean) {
    const userId = current.current!.user._id!.toString();
    await save(userId, (saved) => {
      if (!saved.queue.some((op) => op.id === operation.id && op.conflict))
        return saved;
      const server = operation.conflict!.server;
      if (keepLocal) {
        let version = server?.version ?? 0;
        return {
          ...saved,
          queue: saved.queue.map((op) => {
            if (
              op.kind !== operation.kind ||
              op.entityId !== operation.entityId
            )
              return op;
            const { conflict, ...clean } = op;
            return {
              ...clean,
              id: crypto.randomUUID(),
              sent: false,
              baseVersion: version++,
            };
          }),
          [operation.kind]: saved[operation.kind].map((item) =>
            item._id === operation.entityId
              ? {
                  ...item,
                  version:
                    (server?.version ?? 0) +
                    saved.queue.filter(
                      (op) =>
                        op.kind === operation.kind &&
                        op.entityId === operation.entityId,
                    ).length,
                }
              : item,
          ),
        };
      }
      return {
        ...saved,
        queue: saved.queue.filter(
          (op) =>
            op.kind !== operation.kind || op.entityId !== operation.entityId,
        ),
        [operation.kind]: saved[operation.kind].flatMap((item) =>
          item._id === operation.entityId ? (server ? [server] : []) : [item],
        ),
      };
    });
    void syncRef.current();
  }

  const value: OfflineContextValue = {
    account,
    status,
    syncNow: () => syncRef.current(true),
    exportData: () => exportData(),
    commit,
    add: async (kind, data) => {
      const id = newId();
      const next = await commit(() => [
        { kind, entityId: id, action: 'create', data: { ...data, _id: id } },
      ]);
      return next[kind].find((item) => item._id === id)!;
    },
    update: async (kind, id, data) => {
      const patch = Object.fromEntries(
        Object.entries(data).filter(
          ([key, val]) =>
            !['_id', 'version', 'deleted', 'owner'].includes(key) &&
            val !== undefined,
        ),
      );
      await commit(() => [
        { kind, entityId: id, action: 'patch', data: patch },
      ]);
    },
    remove: async (kind, id) => {
      await commit((saved) => {
        const children = saved.tasks.filter(
          (task) =>
            !task.deleted &&
            (kind === 'lists'
              ? String((task as Task).listId) === id
              : String((task as Task).parentTaskId) === id),
        );
        // Delete descendants before their parent so server ownership checks remain valid.
        const sorted = [...children].sort(
          (a, b) =>
            Number(!!(b as Task).parentTaskId) -
            Number(!!(a as Task).parentTaskId),
        );
        return [
          ...sorted.map((child) => ({
            kind: 'tasks' as const,
            entityId: child._id,
            action: 'delete' as const,
            data: {},
          })),
          { kind, entityId: id, action: 'delete', data: {} },
        ];
      });
    },
    signOut: async () => {
      stopped.current = true;
      await change<boolean>('signedOut', () => true);
      await clearActiveAccount();
      publish(null);
      // Remove caches made by older releases that stored authenticated HTML/RSC.
      if ('caches' in window)
        await Promise.all(
          (await caches.keys())
            .filter(isLegacyCache)
            .map((key) => caches.delete(key)),
        );
      const { logout } = await import('@/src/actions/auth.action');
      try {
        await logout();
      } finally {
        window.location.replace('/login');
      }
    },
  };
  const conflict = account?.queue.find((op) => op.conflict);
  const localItem =
    conflict &&
    account?.[conflict.kind].find((item) => item._id === conflict.entityId);
  const conflictFields = conflict
    ? Object.keys(conflict.data).filter((field) =>
        ['description', 'tags', 'complete', 'color', 'emoji', 'index'].includes(
          field,
        ),
      )
    : [];
  const fieldNames: Record<string, string> = {
    description: 'Description',
    tags: 'Tags',
    complete: 'Completion',
    color: 'Color',
    emoji: 'Emoji',
    index: 'Position',
  };
  const display = (value: unknown) =>
    Array.isArray(value)
      ? value.join(', ')
      : value === null || value === undefined
        ? 'Not set'
        : typeof value === 'boolean'
          ? value
            ? 'Complete'
            : 'Incomplete'
          : String(value);
  const exportData = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(account, null, 2)], {
        type: 'application/json',
      }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'maitu-device-backup.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const notice = !online
    ? 'Offline. Changes are saved on this device.'
    : status.startsWith('Sign in') || status.startsWith('Could not sync')
      ? status
      : null;

  return (
    <OfflineContext.Provider value={value}>
      {notice && (
        <div
          className="border-b border-gray-200 bg-gray-50 px-5 py-2 text-sm"
          role="status"
          aria-live="polite"
        >
          {notice}
          {status.startsWith('Sign in') ? (
            <a href="/login" className="ml-3 underline">
              Sign in
            </a>
          ) : (
            online && (
              <button
                type="button"
                onClick={() => {
                  void syncRef.current(true);
                }}
                className="ml-3 underline"
              >
                Retry sync
              </button>
            )
          )}
        </div>
      )}
      {updateWaiting && (
        <div className="border-b border-gray-200 p-3 text-sm">
          A new version is ready. Your saved device changes will be retained.{' '}
          <button
            type="button"
            className="underline"
            onClick={() => {
              navigator.serviceWorker.addEventListener(
                'controllerchange',
                () => window.location.reload(),
                { once: true },
              );
              updateWaiting.postMessage({ type: 'SKIP_WAITING' });
            }}
          >
            Update app
          </button>
        </div>
      )}
      {storageError && (
        <p role="alert" className="bg-red-50 p-4 text-red-800">
          {storageError}
        </p>
      )}
      {conflict && (
        <section
          className="border-b border-gray-200 p-4"
          aria-label="Sync conflict"
        >
          <p className="font-semibold">A change needs your attention</p>
          <p>{conflict.conflict!.message}</p>
          <p>
            On this device: {localItem?.deleted ? 'Deleted' : localItem?.title}
          </p>
          <p>
            On the server:{' '}
            {conflict.conflict!.server?.deleted
              ? 'Deleted'
              : (conflict.conflict!.server?.title ?? 'Unavailable')}
          </p>
          {conflictFields.map((field) => (
            <div key={field} className="my-2 max-h-40 overflow-auto text-sm">
              <p>
                {fieldNames[field]} on this device:{' '}
                {display(
                  (localItem as unknown as Record<string, unknown>)?.[field],
                )}
              </p>
              <p>
                {fieldNames[field]} on the server:{' '}
                {display(
                  (
                    conflict.conflict!.server as unknown as Record<
                      string,
                      unknown
                    >
                  )?.[field],
                )}
              </p>
            </div>
          ))}
          {!conflict.conflict!.server?.deleted &&
            conflict.action !== 'create' &&
            conflict.conflict!.server && (
              <button
                type="button"
                onClick={() => {
                  void resolve(conflict, true);
                }}
                className="mr-4 underline"
              >
                Keep my change
              </button>
            )}
          <button
            type="button"
            onClick={() => {
              void resolve(conflict, false);
            }}
            className="underline"
          >
            {conflict.conflict!.server
              ? 'Use server version'
              : 'Discard this device change'}
          </button>
        </section>
      )}
      {!ready ? (
        <p className="p-5">Opening Maitu…</p>
      ) : account ? (
        children
      ) : (
        <p className="p-5">
          Sign in online once to save your data for offline use.{' '}
          <a href="/login" className="underline">
            Sign in
          </a>
        </p>
      )}
    </OfflineContext.Provider>
  );
}
