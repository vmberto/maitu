import { Db } from 'src/db/index';
import { Todo, TodoList } from 'src/types/main';

export const get = async (listId: string | string[] | undefined) => {
  const todos = (await Db.todos.where({ listId }).toArray()) || ([] as Todo[]);
  const selectedTodoList = (await Db.todoLists.where({ id: listId }).first()) || ({} as TodoList);
  return { todos, selectedTodoList };
};

export const add = async (addedTodo: Todo) => {
  await Db.cloud.sync();
  await Db.todos.add(addedTodo);
};

export const remove = async (id: string) => {
  await Db.todos.delete(id);
};

export const update = async (id: string, t: Todo) => {
  await Db.todos.put(t, t.id);
};
