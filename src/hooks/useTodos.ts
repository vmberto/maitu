import axios from 'axios';
import type { ObjectId } from 'mongodb';
import { useRouter } from 'next/router';
import {
  createContext,
  type KeyboardEventHandler,
  useMemo,
  useState,
} from 'react';
import type { GenericEvent, TextareaChangeEventHandler } from 'types/events';
import { type Todo, type TodoList } from 'types/main';

let timeouts = [] as Array<{
  id: ObjectId | undefined;
  timeout: NodeJS.Timeout;
}>;

export interface TodosState {
  todosToComplete: Todo[];
  completeTodos: Todo[];
  newTodo: Todo;
  currentTodo: Todo;
  selectedTodoList: TodoList;
  isTodoDetailOpen: boolean;

  handleOpenSlideOver: (todo: Todo) => (e: GenericEvent) => void;
  handleCloseSlideOver: () => void;

  handleClickScreen: () => void;
  handleChangeExistingTodo: (
    t: Todo,
  ) => (e: TextareaChangeEventHandler) => void;
  handleCompleteTodo: (t: Todo) => Promise<void>;
  handleKeyPress: KeyboardEventHandler<HTMLTextAreaElement | HTMLDivElement>;
  handleKeyPressAdd: KeyboardEventHandler<HTMLTextAreaElement>;
  handleChangeNewTodo: (e: TextareaChangeEventHandler) => void;
  handleInputFocus: (t: Todo) => () => Promise<void>;

  updateTodoData: (t: Todo) => () => Promise<void>;
  addTodo: () => Promise<void>;
  updateTodo: (t: Todo) => () => Promise<void>;
}

export const useTodos = (
  listDb: TodoList,
  todosDb: Todo[],
  newTodoInput?: HTMLTextAreaElement,
): TodosState => {
  const { listId } = useRouter().query as { listId: string };

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

  const handleClickScreen = () => {
    newTodoInput?.focus();
  };

  const handleKeyPress: KeyboardEventHandler<
    HTMLTextAreaElement | HTMLDivElement
  > = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      newTodoInput?.focus();
    }
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
    if (t.title.length <= 0) {
      await axios.delete(`/api/todos/${t._id}`);
      setTodos(todos.filter((todo) => todo._id !== t._id));

      return;
    }

    if (t.title !== currentTodo.title) {
      await axios.put(`/api/todos/${t._id}`, t);
      const updatedTodos = todos.map((todo, i) => {
        if (i === todos.indexOf(t)) {
          return {
            ...todo,
            title: t.title,
          };
        }
        return todo;
      });
      setTodos(updatedTodos);
    }
  };

  const updateTodoData = (t: Todo) => async () => {
    await axios.put(`/api/todos/${t._id}`, t);
  };

  const addTodo = async () => {
    const { title } = newTodo;

    if (title && title.length > 0) {
      const todo = {
        listId,
        title,
        complete: false,
        completeDisabled: false,
        description: '',
        createdAt: new Date().toISOString(),
      } as Todo;

      setNewTodo({ title: '' } as Todo);

      // @Todo insert the setTodos above the axios request and after, set an update to add the returned id
      const { data: newTodoObject } = await axios.post<Todo>(
        '/api/todos',
        todo,
      );

      setTodos([...todos, newTodoObject]);
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
      timeouts.push({
        id: t._id,
        timeout: setTimeout(async () => {
          await axios.put(`/api/todos/${t._id}`, {
            ...t,
            complete: true,
            completeDisabled: true,
            completedAt: new Date().toISOString(),
          });
        }, 2000),
      });
    } else {
      const timeoutObj = timeouts.find((timeout) => timeout.id === t._id);
      if (timeoutObj) {
        clearTimeout(timeoutObj.timeout);
        timeouts = timeouts.filter((timeout) => timeout.id !== timeoutObj.id);
      }
    }
    await axios.put(`/api/todos/${t._id}`, {
      ...t,
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
    selectedTodoList: listDb,
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
    handleKeyPress,
    handleClickScreen,
  };
};
export const TodosContext = createContext<TodosState>({} as TodosState);
