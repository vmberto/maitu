import clientPromise from '@/lib/mongo';
import { Collection, Db } from 'mongodb';
import { Todo } from '@/types/TodoList';

let todos: Collection<Todo>;
let db: Db;

async function init() {
  if (db) return;
  try {
    const client = await clientPromise;
    db = await client.db('maitu');
    todos = await db.collection('todos');
  } catch (error) {
    throw error;
  }
}

(async () => {
  await init();
})();

export async function getTodos(listId: any) {
  try {
    if (!todos) await init();
    const result = await todos.aggregate([{ $match: { listId } }]).toArray();
    return { existingTodos: result };
  } catch (error) {
    return { error };
  }
}

export async function createTodo(todo: Todo) {
  try {
    if (!todos) await init();

    const result = await todos.insertOne(todo);

    return { todo: result };
  } catch (error) {
    return { error };
  }
}

export async function updateTodo(todo: Todo) {
  try {
    if (!todos) await init();

    const result = await todos.updateOne({ _id: todo._id }, { $set: todo });

    return { todo: result };
  } catch (error) {
    return { error };
  }
}

export async function deleteTodo({ _id }: { _id: string }) {
  try {
    if (!todos) await init();

    const result = await todos.deleteOne({ _id });

    return { todo: result };
  } catch (error) {
    return { error };
  }
}
