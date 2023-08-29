import Dexie from 'dexie';
import { Todo, TodoList } from 'src/types/main';
import dexieCloud, { DexieCloudTable } from 'dexie-cloud-addon';

export class Database extends Dexie {
  todos!: DexieCloudTable<Todo, 'id'>;
  todoLists!: DexieCloudTable<TodoList, 'id'>;

  constructor() {
    super('maitu', {
      addons: [dexieCloud],
      cache: 'immutable'
    });
    this.version(1).stores({
      todoLists: '@id, title, createdAt',
      todos: '@id, title, listId, complete, completeDisabled, createdAt'
    });
    this.cloud.configure({
      databaseUrl: 'https://znweybxm5.dexie.cloud',
      tryUseServiceWorker: true,
      requireAuth: true
    });
  }
}

export const Db = new Database();
