// src/db/indexedDb.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Task, List } from '@/types/main';

interface AppDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
  };
  lists: {
    key: string;
    value: List;
  };
}

let db: IDBPDatabase<AppDB> | null = null;

export async function getDb() {
  if (!db) {
    db = await openDB<AppDB>('task-app-db', 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('tasks')) {
          database.createObjectStore('tasks', { keyPath: '_id' });
        }
        if (!database.objectStoreNames.contains('lists')) {
          database.createObjectStore('lists', { keyPath: '_id' });
        }
      },
    });
  }
  return db;
}
