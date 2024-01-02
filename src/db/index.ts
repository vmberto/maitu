import Dexie from 'dexie';
import {Todo, TodoList} from '../../types/main';
import dexieCloud, {DexieCloudTable} from 'dexie-cloud-addon';
import * as process from "process";

export class Database extends Dexie {
    todos!: DexieCloudTable<Todo, 'id'>;
    todoLists!: DexieCloudTable<TodoList, 'id'>;

    constructor() {
        super('maitu', {
            addons: [dexieCloud],
            cache: 'immutable'
        });
        this.version(2).stores({
            todoLists: '@id, title, createdAt',
            todos: '@id, title, listId, description, complete, completeDisabled, location, createdAt, completedAt',

            // Access Control tables
            realms: "@realmId",
            members: "@id,[realmId+email]",
            roles: "[realmId+name]",
        });
        this.cloud.configure({
            databaseUrl: process.env.NEXT_PUBLIC_DEXIE_CLOUD_URL!,
            tryUseServiceWorker: true,
            requireAuth: true,
        });
    }
}

export const Db = new Database();
