'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useReducer } from 'react';

import { add, remove, update } from '@/src/actions/todos.service';
import todosReducer, {
  initialTodosState,
  setCurrentTodo,
  setNewTodo,
  setTodos,
  updateSingleElement,
} from '@/src/app/todos/state/reducer';
import { useExecutionTimeout } from '@/src/hooks/useExecutionTimeout';
import { isEmptyString } from '@/src/lib/functions';
import type { TextareaChangeEventHandler } from '@/types/events';
import type { List, Todo } from '@/types/main';

export interface TodosState {
  todosToComplete: Todo[];
  completeTodos: Todo[];
  newTodo: Todo;
  currentTodo: Todo;
  selectedList: List;

  handleChangeExistingTodo: (e: TextareaChangeEventHandler) => void;
  handleCompleteTodo: (t: Todo) => Promise<void>;
  handleChangeNewTodo: (e: TextareaChangeEventHandler) => void;
  handleInputFocus: (t: Todo) => () => Promise<void>;

  handleAddTodo: () => Promise<void>;
  handleRemoveOrUpdateTitle: () => Promise<void>;
  handleUpdateTodo: (t: Todo) => () => Promise<void>;
}

type TodosProviderProps = {
  listDb: List;
  todosDb: Todo[];
  children: ReactNode;
};

const TodosContext = createContext<TodosState>({} as TodosState);

export const TodosProvider = ({
  listDb,
  todosDb,
  children,
}: TodosProviderProps) => {
  const listId = listDb._id;
  const { setExecutionTimeout, clearTimeoutById } = useExecutionTimeout();

  const [state, dispatch] = useReducer(
    todosReducer,
    initialTodosState(todosDb),
  );

  const handleChangeExistingTodo = (e: TextareaChangeEventHandler) => {
    const { currentTodo } = state;
    const { value } = e.target;

    currentTodo.title = value;

    const updatedTodos = state.todos.map((t) =>
      t._id === currentTodo._id ? { ...currentTodo } : t,
    );

    dispatch(setTodos([...updatedTodos]));
    dispatch(setCurrentTodo({ ...currentTodo }));
  };

  const handleChangeNewTodo = (e: TextareaChangeEventHandler) => {
    const newTodoCopy: Todo = { ...state.newTodo };
    const { value } = e.target;
    newTodoCopy.title = value!;
    dispatch(setNewTodo(newTodoCopy));
  };

  const handleInputFocus = (focusedTodo: Todo) => async () => {
    dispatch(setCurrentTodo({ ...focusedTodo }));
  };

  const handleRemoveOrUpdateTitle = async () => {
    const { currentTodo } = state;

    if (isEmptyString(currentTodo.title) && currentTodo._id) {
      dispatch(
        setTodos(state.todos.filter((todo) => todo._id !== currentTodo._id)),
      );

      await remove(currentTodo._id.toString());

      return;
    }

    if (currentTodo._id) {
      await update(currentTodo._id.toString().trim(), currentTodo);
    }
  };

  const handleUpdateTodo = (t: Todo) => async () => {
    if (t._id) {
      dispatch(updateSingleElement(t._id.toString(), { ...t }));

      await update(t._id.toString(), t);
    }
  };

  const handleAddTodo = async () => {
    const todosCopy = [...state.todos];
    const { title } = state.newTodo;

    if (title && title.length > 0) {
      const todo = {
        complete: false,
        description: '',
        createdAt: new Date().toISOString(),
        listId,
        title,
      } as Todo;

      dispatch(setNewTodo({ title: '' } as Todo));

      dispatch(setTodos([...todosCopy, todo]));

      const response = await add(todo);

      dispatch(setTodos([...todosCopy, response]));
    }
  };

  const handleCompleteTodo = async (t: Todo) => {
    if (!t._id) {
      return;
    }

    const todoId = t._id.toString();

    if (!t.complete) {
      const dataToUpdate = {
        complete: true,
        completedAt: new Date().toISOString(),
      };

      setExecutionTimeout(todoId, async () => {
        if (t._id) {
          dispatch(updateSingleElement(t._id.toString(), dataToUpdate));
          await update(t._id.toString(), {
            ...t,
            ...dataToUpdate,
          });
        }
      });
    } else {
      clearTimeoutById(todoId);
    }

    dispatch(
      updateSingleElement(t._id.toString(), {
        complete: !t.complete,
      }),
    );
  };

  const todosToComplete = useMemo(
    () => state.todos.filter((t) => !t.completedAt),
    [state.todos],
  );
  const completeTodos = useMemo(
    () =>
      state.todos
        .filter((t) => t.completedAt)
        .sort(
          (a, b) =>
            new Date(b?.completedAt || '').getTime() -
            new Date(a?.completedAt || '').getTime(),
        ),
    [state.todos],
  );

  const contextValue = {
    todosToComplete,
    completeTodos,
    newTodo: state.newTodo,
    selectedList: listDb,
    currentTodo: state.currentTodo,
    handleAddTodo,
    handleChangeExistingTodo,
    handleChangeNewTodo,
    handleCompleteTodo,
    handleRemoveOrUpdateTitle,
    handleUpdateTodo,
    handleInputFocus,
  };

  return (
    <TodosContext.Provider value={contextValue}>
      {children}
    </TodosContext.Provider>
  );
};

export const useTodos = (): TodosState => useContext(TodosContext);
