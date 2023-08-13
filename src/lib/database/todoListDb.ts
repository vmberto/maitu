import { Db } from 'src/lib/database/index';
import { TodoList } from 'src/types/main';

export const get = async () => {
  return (await Db.todoLists.toArray()) || [];
};

export const add = async (newTodoList: TodoList) => {
  await Db.todoLists.add(newTodoList);
};

export const remove = async (listId: string) => {
  const thisListTodos = await Db.todos.where({ listId }).toArray();
  await Db.todos.bulkDelete(thisListTodos.map((l) => l.id));
  await Db.todoLists.delete(listId);
};
