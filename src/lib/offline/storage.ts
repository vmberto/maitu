import type { LocalAccount } from './model';

let database: Promise<IDBDatabase> | undefined;
const STORE = 'accounts';
function open() {
  if (!database)
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open('maitu-offline', 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onerror = () => {
        database = undefined;
        reject(request.error);
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          database = undefined;
        };
        resolve(request.result);
      };
    });
  return database;
}

export async function read<T>(key: string): Promise<T | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Read + modify + write in one IndexedDB transaction also serializes edits across tabs.
export async function change<T>(
  key: string,
  update: (current: T | undefined) => T,
): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    let result: T;
    let error: unknown;
    store.get(key).onsuccess = (event) => {
      try {
        result = update((event.target as IDBRequest).result);
        store.put(result, key);
      } catch (err) {
        error = err;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve(result);
    tx.onabort = () =>
      reject(
        error ??
          tx.error ??
          new Error('Device storage could not save this change.'),
      );
    tx.onerror = () => reject(tx.error);
  });
}

export const accountKey = (userId: string) => `user:${userId}`;
export const readAccount = (userId: string) =>
  read<LocalAccount>(accountKey(userId));
export const clearActiveAccount = () =>
  change<string | null>('active', () => null);
