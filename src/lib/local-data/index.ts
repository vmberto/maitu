import Dexie, { Table } from 'dexie';
import { TodoList } from '@/types/main';

export class MySubClassedDexie extends Dexie {
  todoLists!: Table<TodoList>;

  constructor() {
    super('maitu');
    this.version(1).stores({
      todoLists: '++_id, title, dateAdded'
    });
  }
}

export const db = new MySubClassedDexie();
