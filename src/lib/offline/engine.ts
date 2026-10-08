import {
  accountKey,
  change,
  clearActiveAccount,
  read,
  readAccount,
} from './storage';
import { enqueue, isLegacyCache, mergeSnapshot, newId } from './model';
import type {
  Entity,
  EntityKind,
  LocalAccount,
  Operation,
  Snapshot,
} from './model';
import type { List, Task, UserObject } from '../../../types/main';

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

export type InputOperation = Omit<Operation, 'id' | 'baseVersion'>;
export type OfflineSnapshot = {
  account: LocalAccount | null;
  ready: boolean;
  status: string;
  online: boolean;
  storageError: string;
  updateWaiting: ServiceWorker | null;
};

export function createOfflineEngine(options: {
  logout: () => Promise<unknown>;
  redirect?: (path: string) => void;
}) {
  let state: OfflineSnapshot = {
    account: null,
    ready: false,
    status: 'Opening device data…',
    online: true,
    storageError: '',
    updateWaiting: null,
  };
  const listeners = new Set<() => void>();
  function set<K extends keyof OfflineSnapshot>(
    key: K,
    value: OfflineSnapshot[K],
  ) {
    if (state[key] === value) return;
    state = { ...state, [key]: value };
    listeners.forEach((notify) => notify());
  }
  const setAccount = (value: LocalAccount | null) => set('account', value);
  const setReady = (value: boolean) => set('ready', value);
  const setStatus = (value: string) => set('status', value);
  const setOnline = (value: boolean) => set('online', value);
  const setStorageError = (value: string) => set('storageError', value);
  const setUpdateWaiting = (value: ServiceWorker | null) =>
    set('updateWaiting', value);
  const redirect =
    options.redirect ?? ((path: string) => window.location.replace(path));
  let current: LocalAccount | null = null;
  let channel: BroadcastChannel | null = null;
  let syncing = false;
  let syncFailures = 0;
  let saving = 0;
  let stopped = false;
  let retry: ReturnType<typeof setTimeout> | undefined;
  function publish(next: LocalAccount | null, broadcast = true) {
    current = next;
    setAccount(next);
    if (broadcast) channel?.postMessage('changed');
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
      if (current?.user._id === userId) publish(next);
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
    const userId = current?.user._id?.toString();
    if (!userId || stopped) throw new Error('Sign in before editing.');
    saving += 1;
    setStatus('Saving on device…');
    let next;
    try {
      next = await save(userId, (saved) => enqueue(saved, build(saved)));
    } finally {
      saving -= 1;
    }
    setStatus(
      saving ? 'Saving on device…' : 'Saved on device. Waiting to sync.',
    );
    clearTimeout(retry);
    retry = setTimeout(() => {
      void sync();
    }, 500);
    return next;
  }

  async function sync(manual = false) {
    setOnline(navigator.onLine);
    if (syncing || stopped || !navigator.onLine) {
      if (!navigator.onLine)
        setStatus('Offline. Changes are saved on this device.');
      return;
    }
    syncing = true;
    clearTimeout(retry);
    let completed = false;
    try {
      setStatus('Syncing…');
      const { user }: { user: UserObject } = await request('/api/session');
      if (stopped) return;
      const userId = user._id!.toString();
      if (current?.user._id !== userId) {
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
        while (!stopped && current?.user._id === userId) {
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
        if (stopped || current?.user._id !== userId) return;
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
      syncFailures = 0;
      if (!stopped)
        setStatus(
          current?.queue.some((op) => op.conflict)
            ? 'Saved on device. Some changes need attention.'
            : current?.queue.length
              ? 'Saved on device. Waiting to sync.'
              : 'All changes synced.',
        );
    } catch (error) {
      if (!stopped) {
        syncFailures += 1;
        setStatus(
          error instanceof Error && error.message.startsWith('Sign in')
            ? error.message
            : manual || syncFailures >= 2
              ? 'Could not sync. Changes stay saved on this device.'
              : 'Saved on device. Waiting to sync.',
        );
        if (!(error instanceof Error && error.message.startsWith('Sign in')))
          retry = setTimeout(() => void sync(), Math.min(2000 * syncFailures, 30000));
        if (
          !current &&
          error instanceof Error &&
          error.message.startsWith('Sign in')
        )
          redirect('/login');
      }
    } finally {
      syncing = false;
      // Edits made during a snapshot fetch may miss their debounce; flush them promptly.
      if (
        completed &&
        !stopped &&
        current?.queue[0] &&
        !current.queue[0].conflict
      ) {
        clearTimeout(retry);
        retry = setTimeout(() => {
          void sync();
        }, 500);
      }
    }
  }
  function start() {
    stopped = false;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('maitu-offline');
      channel.onmessage = async () => {
        const active = await read<string | null>('active');
        publish(active ? ((await readAccount(active)) ?? null) : null, false);
        if (!active) {
          stopped = true;
          redirect('/login');
        }
      };
    }
    void (async () => {
      try {
        const [signedOut, active] = await Promise.all([
          read<boolean>('signedOut'),
          read<string>('active'),
        ]);
        if (signedOut) {
          stopped = true;
          redirect('/login');
          setReady(true);
          return;
        }
        if (active && !stopped)
          publish((await readAccount(active)) ?? null, false);
        setReady(true);
        await sync();
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
        if (stopped) return;
        registration = value;
        checkUpdate();
        registration.addEventListener('updatefound', updateFound);
      });
    const trigger = () => {
      if (document.visibilityState === 'visible') void sync();
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
      stopped = true;
      clearTimeout(retry);
      clearInterval(interval);
      channel?.close();
      registration?.removeEventListener('updatefound', updateFound);
      window.removeEventListener('online', trigger);
      window.removeEventListener('offline', offline);
      window.removeEventListener('focus', trigger);
      document.removeEventListener('visibilitychange', trigger);
    };
  }

  async function resolve(operation: Operation, keepLocal: boolean) {
    const userId = current!.user._id!.toString();
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
    void sync();
  }

  const actions = {
    commit,
    add: async (kind: EntityKind, data: List | Task) => {
      const id = newId();
      const next = await commit(() => [
        { kind, entityId: id, action: 'create', data: { ...data, _id: id } },
      ]);
      return next[kind].find((item) => item._id === id)!;
    },
    update: async (
      kind: EntityKind,
      id: string,
      data: Partial<List & Task>,
    ) => {
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
    remove: async (kind: EntityKind, id: string) => {
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
      stopped = true;
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
      try {
        await options.logout();
      } finally {
        redirect('/login');
      }
    },
  };

  return {
    ...actions,
    sync,
    resolve,
    start,
    getSnapshot: () => state,
    subscribe: (notify: () => void) => {
      listeners.add(notify);
      return () => {
        listeners.delete(notify);
      };
    },
  };
}
export type OfflineEngine = ReturnType<typeof createOfflineEngine>;
