import Dexie, { Table } from 'dexie';
import { Todo, TodoList } from '@/types/main';

export class Database extends Dexie {
  todoLists!: Table<TodoList>;
  todos!: Table<Todo>;

  constructor() {
    super('maitu');
    this.version(1).stores({
      todoLists: '++_id, title, dateAdded',
      todos: '++_id, title, listId'
    });
  }
}

export const Db = new Database();
