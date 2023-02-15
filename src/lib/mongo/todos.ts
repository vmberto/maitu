import clientPromise from '@/lib/mongo';
import { Collection, Db } from 'mongodb';
import { Todo, Main } from '@/types/main';

let todos: Collection<Todo>;
let todoLists: Collection<Main>;
let db: Db;

async function init() {
  if (db) return;
  try {
    const client = await clientPromise;
    db = await client.db('maitu');
    todoLists = await db.collection('todo-lists');
    todos = await db.collection('todos');
  } catch (error) {
    throw error;
  }
}

(async () => {
  await init();
})();

export async function getTodos(listId: string) {
  try {
    if (!todoLists) await init();
    const result = await todoLists
      .aggregate([
        {
          $lookup: {
            from: 'todos',
            localField: '_id',
            foreignField: 'listId',
            as: 'todos'
          }
        },
        { $match: { _id: listId } }
      ])
      .tryNext();
    return { result };
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
