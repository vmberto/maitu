'use client';

import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';

import { add, remove, update } from '@/src/actions/todos.service';
import todosReducer, {
  initialTodosState,
  setCurrentTodo,
  setNewTodo,
  setTodos,
  updateSingleElement,
} from '@/src/app/todos/state/reducer';
import { useExecutionTimeout } from '@/src/hooks/useExecutionTimeout';
import type { TextareaChangeEventHandler } from '@/types/events';
import type { List, Todo } from '@/types/main';

export interface TodosState {
  todosToComplete: Todo[];
  completeTodos: Todo[];
  newTodo: Todo;
  currentTodo: Todo;
  selectedList: List;

  handleChangeExistingTodo: (
    t: Todo,
  ) => (e: TextareaChangeEventHandler) => void;
  handleCompleteTodo: (t: Todo) => Promise<void>;
  handleChangeNewTodo: (e: TextareaChangeEventHandler) => void;
  handleInputFocus: (t: Todo) => () => Promise<void>;

  handleAddTodo: () => Promise<void>;
  handleRemoveOrUpdateTitle: (t: Todo) => () => Promise<void>;
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

  const handleChangeExistingTodo = useCallback(
    (todo: Todo) => (e: TextareaChangeEventHandler) => {
      const { value } = e.target;

      const updatedTodos = state.todos.map((t) =>
        t._id === todo._id ? { ...t, title: value } : t,
      );

      dispatch(setTodos([...updatedTodos]));
    },
    [state.todos],
  );

  const handleChangeNewTodo = useCallback(
    (e: TextareaChangeEventHandler) => {
      const newTodoCopy: Todo = { ...state.newTodo };
      const { value } = e.target;
      newTodoCopy.title = value!;
      dispatch(setNewTodo(newTodoCopy));
    },
    [state.newTodo],
  );

  const handleInputFocus = (t: Todo) => async () => {
    dispatch(setCurrentTodo({ ...t }));
  };

  const handleRemoveOrUpdateTitle = useCallback(
    (t: Todo) => async () => {
      if (t.title.length <= 0 && t._id) {
        dispatch(setTodos(state.todos.filter((todo) => todo._id !== t._id)));

        await remove(t._id.toString());

        return;
      }

      if (t.title !== state.currentTodo.title && t._id) {
        await update(t._id.toString(), t);
      }
    },
    [state.currentTodo.title, state.todos],
  );

  const handleUpdateTodo = useCallback(
    (t: Todo) => async () => {
      if (t._id) {
        dispatch(updateSingleElement(t._id.toString(), { ...t }));

        await update(t._id.toString(), t);
      }
    },
    [],
  );

  const handleAddTodo = useCallback(async () => {
    const todosCopy = [...state.todos];
    const { title } = state.newTodo;

    if (title && title.length > 0) {
      const todo = {
        complete: false,
        completeDisabled: false,
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
  }, [listId, state.newTodo, state.todos]);

  const handleCompleteTodo = useCallback(
    async (t: Todo) => {
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
    },
    [clearTimeoutById, setExecutionTimeout],
  );

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

  const contextValue = useMemo(
    () => ({
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
    }),
    [
      handleAddTodo,
      completeTodos,
      state.currentTodo,
      handleChangeExistingTodo,
      handleChangeNewTodo,
      handleCompleteTodo,
      listDb,
      state.newTodo,
      handleRemoveOrUpdateTitle,
      todosToComplete,
      handleUpdateTodo,
    ],
  );

  return (
    <TodosContext.Provider value={contextValue}>
      {children}
    </TodosContext.Provider>
  );
};

export const useTodos = (): TodosState => useContext(TodosContext);
