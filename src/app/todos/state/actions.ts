import { add, remove, update } from '@/src/actions/todos.service';
import type { TodosState } from '@/src/app/todos/state/store';
import type { TextareaChangeEventHandler } from '@/types/events';
import type { Todo } from '@/types/main';
import type { GetAction, SetAction } from '@/types/zustand';

export const handleAddTodo = async (
  get: GetAction<TodosState>,
  set: SetAction<TodosState>,
) => {
  const { todos, newTodo, selectedList } = get();
  const todosCopy = [...todos];
  const { title } = newTodo;

  if (title && title.length > 0) {
    const todo = {
      complete: false,
      completeDisabled: false,
      description: '',
      createdAt: new Date().toISOString(),
      listId: selectedList._id,
      title,
    } as Todo;

    set({ newTodo: { title: '' } });

    set({ todos: [...todosCopy, todo] });

    const response = await add(todo); // Assuming add function is defined elsewhere

    set({ todos: [...todosCopy, response] });
  }
};

export const handleCompleteTodo = async (
  t: Todo,
  executionTimeout: any,
  get: GetAction<TodosState>,
  set: SetAction<TodosState>,
) => {
  const { setExecutionTimeout, clearTimeoutById } = executionTimeout;
  const { todos } = get();

  if (!t._id) {
    return;
  }

  const todoId = t._id.toString();

  if (!t.complete) {
    const dataToUpdate = {
      complete: true,
      completeDisabled: true,
      completedAt: new Date().toISOString(),
    };

    setExecutionTimeout(todoId, async () => {
      if (t._id) {
        set({
          todos: todos.map((todo: Todo) =>
            todo._id === todoId ? { ...todo, ...dataToUpdate } : todo,
          ),
        });

        await update(t._id.toString(), {
          ...t,
          ...dataToUpdate,
        });
      }
    });
  } else {
    clearTimeoutById(todoId);
  }

  set({
    todos: todos.map((todo: Todo) =>
      todo._id === todoId ? { ...todo, complete: !todo.complete } : todo,
    ),
  });
};
export const handleChangeExistingTodo = (
  e: TextareaChangeEventHandler,
  get: GetAction<TodosState>,
  set: SetAction<TodosState>,
) => {
  const { currentTodo, todos } = get();
  const { value } = e.target;

  const updatedTodos = todos.map((t: Todo) =>
    t._id === currentTodo._id ? { ...t, title: value } : t,
  );

  set({ todos: updatedTodos });
};

export const handleRemoveOrUpdateTitle = async (
  t: Todo,
  get: GetAction<TodosState>,
  set: SetAction<TodosState>,
) => {
  const { todos, currentTodo } = get();

  if (t.title.length <= 0 && t._id) {
    set({ todos: todos.filter((todo: Todo) => todo._id !== t._id) });

    await remove(t._id.toString());

    return;
  }

  if (t.title !== currentTodo.title && t._id) {
    await update(t._id.toString(), t);
  }
};

export const handleUpdateTodo = async (
  t: Todo,
  get: GetAction<TodosState>,
  set: SetAction<TodosState>,
) => {
  const { todos } = get();

  if (t._id) {
    set({
      todos: todos.map((todo: Todo) => (todo._id === t._id ? { ...t } : todo)),
    });

    await update(t._id.toString(), t);
  }
};

export const handleChangeNewTodo = (
  e: TextareaChangeEventHandler,
  get: GetAction<TodosState>,
  set: SetAction<TodosState>,
) => {
  const { newTodo } = get();
  const newTodoCopy: Partial<Todo> = { ...newTodo };
  const { value } = e.target;
  newTodoCopy.title = value!;
  set({ newTodo: newTodoCopy });
};
