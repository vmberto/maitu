import Dexie from 'dexie';
import { Todo, TodoList } from 'src/types/main';
import dexieCloud, { DexieCloudTable } from 'dexie-cloud-addon';

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
      requireAuth: true,
      periodicSync: { minInterval: 5000 }
    });
    this.cloud.persistedSyncState.subscribe((x) => console.log('persistedSyncState', x));
    this.cloud.webSocketStatus.subscribe((x) => console.log('webSocketStatus', x));
  }
}

export const Db = new Database();
