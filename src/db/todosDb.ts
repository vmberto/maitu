import { Db } from 'src/db/index';

import { type Todo, type TodoList } from '../../types/main';

export const get = async (listId: string) => {
  const todos = (await Db.todos.where({ listId }).toArray()) || ([] as Todo[]);
  const selectedTodoList =
    (await Db.todoLists.where({ id: listId }).first()) || ({} as TodoList);
  return {
    todos: [...todos].sort((a, b) => a.index - b.index),
    selectedTodoList,
  };
};

export const getAll = async () => {
  const todos = (await Db.todos.toArray()) || ([] as Todo[]);
  return { todos };
};

export const add = async (addedTodo: Todo) => {
  const { todos } = await get(addedTodo.listId);
  await Db.todos.add({ ...addedTodo, index: todos.length });
};

export const remove = async (id: string) => {
  await Db.todos.delete(id);
};

export const update = async (t: Todo) => {
  await Db.todos.put(t, t.id);
};

export const updateOrder = async (
  listId: string,
  initialIndex: number,
  destinationIndex: number,
) => {
  let { todos } = await get(listId);

  todos = todos.filter((todo) => !todo.complete);

  const [movedElement] = todos.splice(initialIndex, 1);

  todos.splice(destinationIndex, 0, movedElement);

  await Db.todos.bulkUpdate(
    todos.map((item, index) => ({
      key: item.id,
      changes: { index },
    })),
  );
};
