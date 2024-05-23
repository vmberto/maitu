import { create } from 'zustand';

import { add, remove, update } from '@/src/actions/todos.service';
import type { TextareaChangeEventHandler } from '@/types/events';
import type { List, Todo } from '@/types/main';

export interface TodosState {
  currentTodo: Partial<Todo>;
  newTodo: Partial<Todo>;
  todos: Todo[];
  selectedList: List;

  setTodos: (todo: Todo[]) => void;
  setList: (selectedList: List) => void;

  handleInputFocus: (todo: Partial<Todo>) => void;
  handleAddTodo: () => void;
  handleUpdateTodo: (todo: Todo) => Promise<void>;
  handleChangeNewTodo: (e: TextareaChangeEventHandler) => void;
  handleChangeExistingTodo: (e: TextareaChangeEventHandler) => void;
  handleRemoveOrUpdateTitle: (todo: Todo) => void;
  handleCompleteTodo: (todo: Todo, executionTimeout: any) => void;
}

export const useTodosStore = create<TodosState>((set: any, get: any) => ({
  todos: [],
  currentTodo: {},
  newTodo: {},
  selectedList: {} as List,

  setTodos: (todos: Todo[]) => set({ todos }),
  setList: (selectedList: List) => set({ selectedList }),
  handleInputFocus: (currentTodo: Partial<Todo>) => set({ currentTodo }),

  handleAddTodo: async () => {
    const { newTodo, selectedList } = get();
    const { title } = newTodo;

    if (title && title.length > 0) {
      const todo = {
        complete: false,
        description: '',
        createdAt: new Date().toISOString(),
        listId: selectedList._id,
        title,
      } as Todo;

      set((state: TodosState) => ({
        newTodo: { title: '' },
        todos: [...state.todos, todo],
      }));

      const response = await add(todo);
      set((state: TodosState) => ({
        todos: state.todos.map((t: Todo) =>
          t.createdAt === todo.createdAt ? response : t,
        ),
      }));
    }
  },

  handleCompleteTodo: async (t: Todo) => {
    if (!t._id) return;

    const todoId = t._id.toString();

    set((state: TodosState) => {
      return {
        todos: state.todos.map((todo) =>
          todo._id === todoId
            ? { ...todo, complete: true, completedAt: new Date().toISOString() }
            : todo,
        ),
      };
    });
  },

  handleChangeExistingTodo: (e: TextareaChangeEventHandler) => {
    const { currentTodo } = get();
    const { value } = e.target;

    set((state: TodosState) => ({
      todos: state.todos.map((t: Todo) =>
        t._id === currentTodo._id ? { ...t, title: value } : t,
      ),
    }));
  },

  handleRemoveOrUpdateTitle: async (t: Todo) => {
    if (t.title.length <= 0 && t._id) {
      set((state: TodosState) => ({
        todos: state.todos.filter((todo: Todo) => todo._id !== t._id),
      }));
      await remove(t._id.toString());
      return;
    }

    const { currentTodo } = get();
    if (t.title !== currentTodo.title && t._id) {
      set((state: TodosState) => ({
        todos: state.todos.map((todo: Todo) =>
          todo._id === t._id ? { ...t } : todo,
        ),
      }));
      await update(t._id.toString(), t);
    }
  },

  handleUpdateTodo: async (updatedTodo: Todo) => {
    if (updatedTodo._id) {
      set((state: TodosState) => ({
        todos: state.todos.map((todo: Todo) =>
          todo._id === updatedTodo._id ? { ...updatedTodo } : todo,
        ),
      }));

      await update(updatedTodo._id.toString(), updatedTodo);
    }
  },

  handleChangeNewTodo: (e: TextareaChangeEventHandler) => {
    const { value } = e.target;
    set((state: TodosState) => ({
      newTodo: { ...state.newTodo, title: value },
    }));
  },
}));
