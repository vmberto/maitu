import type { KeyboardEventHandler, ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { add, remove, update } from '@/src/actions/todos.service';
import { useExecutionTimeout } from '@/src/hooks/useExecutionTimeout';
import { updateSingleElement } from '@/src/lib/functions';
import type { GenericEvent, TextareaChangeEventHandler } from '@/types/events';
import { type List, type Todo } from '@/types/main';

export interface TodosState {
  todosToComplete: Todo[];
  completeTodos: Todo[];
  newTodo: Todo;
  currentTodo: Todo;
  selectedList: List;
  isTodoDetailOpen: boolean;

  handleOpenSlideOver: (todo: Todo) => (e: GenericEvent) => void;
  handleCloseSlideOver: () => void;

  handleChangeExistingTodo: (
    t: Todo,
  ) => (e: TextareaChangeEventHandler) => void;
  handleCompleteTodo: (t: Todo) => Promise<void>;
  handleKeyPressAdd: KeyboardEventHandler<HTMLTextAreaElement>;
  handleChangeNewTodo: (e: TextareaChangeEventHandler) => void;
  handleInputFocus: (t: Todo) => () => Promise<void>;

  updateTodoData: (t: Todo) => () => Promise<void>;
  addTodo: () => Promise<void>;
  updateTodo: (t: Todo) => () => Promise<void>;
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

  const [todos, setTodos] = useState(todosDb);
  const [currentTodo, setCurrentTodo] = useState({} as Todo);
  const [newTodo, setNewTodo] = useState({} as Todo);
  const [isTodoDetailOpen, setIsTodoDetailOpen] = useState(false);

  const handleOpenSlideOver = (todo: Todo) => (e: GenericEvent) => {
    e.stopPropagation();
    setCurrentTodo(todo);
    setIsTodoDetailOpen(true);
  };

  const handleCloseSlideOver = () => {
    setIsTodoDetailOpen(false);
  };

  const handleChangeExistingTodo = useCallback(
    (todo: Todo) => (e: TextareaChangeEventHandler) => {
      const { value } = e.target;

      const updatedTodos = todos.map((t) =>
        t._id === todo._id ? { ...t, title: value } : t,
      );

      setTodos([...updatedTodos]);
    },
    [todos],
  );

  const handleChangeNewTodo = useCallback(
    (e: TextareaChangeEventHandler) => {
      const newTodoCopy: Todo = { ...newTodo };
      const { value } = e.target;
      newTodoCopy.title = value!;
      setNewTodo(newTodoCopy);
    },
    [newTodo],
  );

  const handleInputFocus = (t: Todo) => async () => {
    setCurrentTodo({ ...t });
  };

  const onBlurUpdateTodo = useCallback(
    (t: Todo) => async () => {
      if (t.title.length <= 0 && t._id) {
        setTodos(todos.filter((todo) => todo._id !== t._id));

        await remove(t._id.toString());

        return;
      }

      if (t.title !== currentTodo.title && t._id) {
        await update(t._id.toString(), t);
      }
    },
    [currentTodo.title, todos],
  );

  const updateTodoData = useCallback(
    (t: Todo) => async () => {
      if (t._id) {
        updateSingleElement<Todo>(t._id, todos, setTodos, { ...t });

        await update(t._id.toString(), t);
      }
    },
    [todos],
  );

  const addTodo = useCallback(async () => {
    const todosCopy = [...todos];
    const { title } = newTodo;

    if (title && title.length > 0) {
      const todo = {
        complete: false,
        completeDisabled: false,
        description: '',
        createdAt: new Date().toISOString(),
        listId,
        title,
      } as Todo;

      setNewTodo({ title: '' } as Todo);

      setTodos([...todosCopy, todo]);

      const response = await add(todo);

      setTodos([...todosCopy, response]);
    }
  }, [listId, newTodo, todos]);

  const handleKeyPressAdd: KeyboardEventHandler<HTMLTextAreaElement> =
    useCallback(
      async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          await addTodo();
        }
      },
      [addTodo],
    );

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
            updateSingleElement<Todo>(t._id, todos, setTodos, dataToUpdate);
            await update(t._id.toString(), {
              ...t,
              ...dataToUpdate,
            });
          }
        });
      } else {
        clearTimeoutById(todoId);
      }

      updateSingleElement<Todo>(t._id, todos, setTodos, {
        complete: !t.complete,
      });
    },
    [clearTimeoutById, setExecutionTimeout, todos],
  );

  const todosToComplete = useMemo(
    () => todos.filter((t) => !t.completeDisabled),
    [todos],
  );
  const completeTodos = useMemo(
    () => todos.filter((t) => t.completeDisabled),
    [todos],
  );

  const contextValue = useMemo(
    () => ({
      todosToComplete,
      completeTodos,
      newTodo,
      selectedList: listDb,
      currentTodo,
      isTodoDetailOpen,
      handleOpenSlideOver,
      handleCloseSlideOver,
      handleKeyPressAdd,
      addTodo,
      handleChangeExistingTodo,
      handleChangeNewTodo,
      handleCompleteTodo,
      updateTodo: onBlurUpdateTodo,
      updateTodoData,
      handleInputFocus,
    }),
    [
      addTodo,
      completeTodos,
      currentTodo,
      handleChangeExistingTodo,
      handleChangeNewTodo,
      handleCompleteTodo,
      handleKeyPressAdd,
      isTodoDetailOpen,
      listDb,
      newTodo,
      onBlurUpdateTodo,
      todosToComplete,
      updateTodoData,
    ],
  );

  return (
    <TodosContext.Provider value={contextValue}>
      {children}
    </TodosContext.Provider>
  );
};

export const useTodos = (): TodosState => useContext(TodosContext);
