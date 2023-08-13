import Dexie from 'dexie';
import { Todo, TodoList } from 'src/types/main';
import dexieCloud, { DexieCloudTable } from 'dexie-cloud-addon';
import { populate } from 'src/lib/database/populate';

export class Database extends Dexie {
  todos!: DexieCloudTable<Todo, 'id'>;
  todoLists!: DexieCloudTable<TodoList, 'id'>;

  constructor() {
    super('maitu', {
      addons: [dexieCloud]
    });
    this.version(1).stores({
      todoLists: '@id, title, dateAdded',
      todos: '@id, title, listId'
    });
    this.cloud.configure({
      databaseUrl: 'https://znweybxm5.dexie.cloud',
      tryUseServiceWorker: true,
      requireAuth: true
    });

    this.on('populate', () => {
      this.on('ready', () => {
        return populate(this);
      });
    });
  }
}

export const Db = new Database();
