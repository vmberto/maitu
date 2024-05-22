import { create } from 'zustand';

import {
  handleAddTodo,
  handleChangeExistingTodo,
  handleChangeNewTodo,
  handleCompleteTodo,
  handleRemoveOrUpdateTitle,
  handleUpdateTodo,
} from '@/src/app/todos/state/actions';
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

export const useTodosStore = create<TodosState>()((set, get) => ({
  todos: [] as Todo[],
  currentTodo: {} as Partial<Todo>,
  newTodo: {} as Partial<Todo>,
  selectedList: {} as List,

  setList: (selectedList: List) => set(() => ({ selectedList })),
  setTodos: (todos: Todo[]) => set(() => ({ todos })),
  handleInputFocus: (currentTodo) => set(() => ({ currentTodo })),

  handleChangeNewTodo: (e: TextareaChangeEventHandler) =>
    handleChangeNewTodo(e, get, set),
  handleAddTodo: () => handleAddTodo(get, set),

  handleUpdateTodo: (todo: Todo) => handleUpdateTodo(todo, get, set),

  handleChangeExistingTodo: (e: TextareaChangeEventHandler) =>
    handleChangeExistingTodo(e, get, set),

  handleRemoveOrUpdateTitle: (todo: Todo) =>
    handleRemoveOrUpdateTitle(todo, get, set),

  handleCompleteTodo: (todo: Todo, executionTimeout: any) =>
    handleCompleteTodo(todo, executionTimeout, get, set),
}));
