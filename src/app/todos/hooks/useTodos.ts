import type { ObjectId } from 'mongodb';
import {
  createContext,
  type KeyboardEventHandler,
  useMemo,
  useState,
} from 'react';

import { add, remove, update } from '@/src/actions/todos.service';
import { updateSingleElement } from '@/src/lib/functions';
import type { GenericEvent, TextareaChangeEventHandler } from '@/types/events';
import { type List, type Todo } from '@/types/main';

let timeouts = [] as Array<{
  id: ObjectId | undefined;
  timeout: NodeJS.Timeout;
}>;

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

export const useTodos = (listDb: List, todosDb: Todo[]): TodosState => {
  const listId = listDb._id;

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

  const handleChangeExistingTodo =
    (todo: Todo) => (e: TextareaChangeEventHandler) => {
      const { value } = e.target;

      const updatedTodos = todos.map((t) =>
        t._id === todo._id ? { ...t, title: value } : t,
      );

      setTodos([...updatedTodos]);
    };

  const handleChangeNewTodo = (e: TextareaChangeEventHandler) => {
    const newTodoCopy: Todo = { ...newTodo };
    const { value } = e.target;
    newTodoCopy.title = value!;
    setNewTodo(newTodoCopy);
  };

  const handleInputFocus = (t: Todo) => async () => {
    setCurrentTodo({ ...t });
  };

  const onBlurUpdateTodo = (t: Todo) => async () => {
    if (t.title.length <= 0 && t._id) {
      setTodos(todos.filter((todo) => todo._id !== t._id));

      await remove(t._id.toString());

      return;
    }

    if (t.title !== currentTodo.title && t._id) {
      await update(t._id.toString(), t);
    }
  };

  const updateTodoData = (t: Todo) => async () => {
    if (t._id) {
      updateSingleElement<Todo>(t._id, todos, setTodos, { ...t });

      await update(t._id.toString(), t);
    }
  };

  const addTodo = async () => {
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
  };

  const handleKeyPressAdd: KeyboardEventHandler<HTMLTextAreaElement> = async (
    e,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await addTodo();
    }
  };

  const handleCompleteTodo = async (t: Todo) => {
    if (!t.complete) {
      const dataToUpdate = {
        complete: true,
        completeDisabled: true,
        completedAt: new Date().toISOString(),
      };
      timeouts.push({
        id: t._id,
        timeout: setTimeout(async () => {
          if (t._id) {
            updateSingleElement<Todo>(t._id, todos, setTodos, dataToUpdate);
            await update(t._id.toString(), {
              ...t,
              ...dataToUpdate,
            });
          }
        }, 2000),
      });
    } else {
      const timeoutObj = timeouts.find((timeout) => timeout.id === t._id);
      if (timeoutObj) {
        clearTimeout(timeoutObj.timeout);
        timeouts = timeouts.filter((timeout) => timeout.id !== timeoutObj.id);
      }
    }
    updateSingleElement<Todo>(t._id, todos, setTodos, {
      complete: !t.complete,
    });
  };

  const todosToComplete = useMemo(
    () => todos.filter((t) => !t.completeDisabled),
    [todos],
  );
  const completeTodos = useMemo(
    () => todos.filter((t) => t.completeDisabled),
    [todos],
  );

  return {
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
  };
};
export const TodosContext = createContext<TodosState>({} as TodosState);
