import clientPromise from '@/lib/mongo';
import { Collection, Db } from 'mongodb';
import { Main } from '@/types/main';

let todoLists: Collection<Main>;
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

export async function createTodoList(todoList: Main) {
  try {
    if (!todoLists) await init();
    const result = await todoLists.insertOne(todoList);

    return { todoList: result };
  } catch (error) {
    return { error };
  }
}
