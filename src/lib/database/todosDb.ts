import { Db } from '@/lib/database/index';
import { Todo, TodoList } from '@/types/main';

export const get = async (listId: string | string[] | undefined) => {
  const todos = (await Db.todos.where({ listId }).toArray()) || [];
  const selectedTodoList = (await Db.todoLists.where({ _id: listId }).first()) || {};
  return { todos, selectedTodoList };
};

export const add = async (addedTodo: Todo) => {
  await Db.todos.add(addedTodo);
};

export const remove = async (id: string) => {
  await Db.todos.delete(id);
};

export const update = async (id: string, t: Todo) => {
  await Db.todos.put(t, t._id);
};
