import clientPromise from '@/lib/mongo';
import { Collection, Db } from 'mongodb';
import { TodoList } from '@/types/main';

let todoLists: Collection<TodoList>;
let db: Db;

async function init() {
  if (db) return;
  try {
    const client = await clientPromise;
    db = await client.db('maitu');
    todoLists = await db.collection('todo-lists');
  } catch (error) {
    throw error;
  }
}

(async () => {
  await init();
})();

export async function getTodoLists() {
  try {
    if (!todoLists) await init();
    const result = (await todoLists.find().limit(20).toArray()) || [];

    return { todoLists: result };
  } catch (error) {
    return { error };
  }
}

export async function syncTodoList(todoListsLocal: TodoList[]) {
  try {
    if (!todoLists) await init();
    const result = await todoLists.updateMany({}, todoListsLocal, { upsert: true });

    return { todoLists: result };
  } catch (error) {
    return { error };
  }
}

export async function createTodoList(newTodoList: TodoList) {
  try {
    if (!todoLists) await init();
    const result = await todoLists.insertOne(newTodoList);

    return { todoList: result };
  } catch (error) {
    return { error };
  }
}

export async function deleteTodoList(_id: string) {
  try {
    if (!todoLists) await init();
    const result = await todoLists.deleteOne({ _id });

    return { todoList: result };
  } catch (error) {
    return { error };
  }
}
