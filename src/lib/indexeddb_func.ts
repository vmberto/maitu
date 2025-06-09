import type { List, Task } from '@/types/main';

import { getDb } from './indexeddb';

// TASKS
export const saveTasks = async (tasks: Task[]) => {
  const db = await getDb();
  const tx = db.transaction('tasks', 'readwrite');
  await Promise.all(tasks.map((task) => tx.store.put(task)));
  await tx.done;
};

export const getAllTasks = async (): Promise<Task[]> => {
  const db = await getDb();
  return db.getAll('tasks');
};

// LISTS
export const saveLists = async (lists: List[]) => {
  const db = await getDb();
  const tx = db.transaction('lists', 'readwrite');
  await Promise.all(lists.map((list) => tx.store.put(list)));
  await tx.done;
};

export const getAllLists = async (): Promise<List[]> => {
  const db = await getDb();
  return db.getAll('lists');
};
