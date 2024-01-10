import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/router';
import { type KeyboardEventHandler, useMemo, useState } from 'react';
import type { DropResult } from 'react-beautiful-dnd';
import * as TodosDb from 'src/db/todosDb';
import type { TextareaChangeEventHandler } from 'types/events';
import { type Todo, type TodoList } from 'types/main';

let timeouts = [] as Array<{ id: string; timeout: NodeJS.Timeout }>;

export interface TodosState {
  todosToComplete: Todo[];
  completedTodos: Todo[];
  newTodo: Todo;
  selectedTodoList: TodoList;
  updateTodoData: (t: Todo) => () => Promise<void>;
  handleClickScreen: () => void;
  handleChangeExistingTodo: (
    t: Todo,
  ) => (e: TextareaChangeEventHandler) => void;
  handleCompleteTodo: (t: Todo) => Promise<void>;
  handleKeyPress: KeyboardEventHandler<HTMLTextAreaElement | HTMLDivElement>;
  handleKeyPressAdd: KeyboardEventHandler<HTMLTextAreaElement>;
  handleChangeNewTodo: (e: TextareaChangeEventHandler) => void;
  handleInputFocus: (t: Todo) => () => Promise<void>;
  addTodo: () => Promise<void>;
  updateTodosOrder: (result: DropResult) => Promise<void>;
  updateTodo: (t: Todo) => () => Promise<void>;
}

export const useTodos = (newTodoInput?: HTMLTextAreaElement): TodosState => {
  const { listId } = useRouter().query as { listId: string };
  const [currentTodo, setCurrentTodo] = useState({} as Todo);
  const [todos, setTodos] = useState<Todo[]>([] as Todo[]);
  const [selectedTodoList, setSelectedTodoList] = useState<TodoList>(
    {} as TodoList,
  );
  const [newTodo, setNewTodo] = useState<Todo>({} as Todo);

  useLiveQuery(() => {
    const fetchData = async () => {
      if (listId) {
        const { selectedTodoList: dbList, todos: dbTodos } =
          await TodosDb.get(listId);
        setTodos(dbTodos);
        setSelectedTodoList(dbList);
      }
    };

    return fetchData();
  }, [listId]);

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
      const { id } = todo;

      const updatedTodos = todos.map((t) =>
        t.id === id ? { ...t, title: value } : t,
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

  const updateTodo = (t: Todo) => async () => {
    if (t.title.length <= 0) {
      await TodosDb.remove(t.id);

      return;
    }

    if (t.title !== currentTodo.title) {
      await TodosDb.update(t);
    }
  };

  const updateTodoData = (t: Todo) => async () => {
    await TodosDb.update(t);
  };

  const addTodo = async () => {
    const { title } = newTodo;

    if (title && title.length > 0) {
      const addedTodo = {
        listId,
        title,
        complete: false,
        completeDisabled: false,
        description: '',
        createdAt: new Date(),
      } as Todo;

      setNewTodo({ title: '' } as Todo);
      await TodosDb.add(addedTodo);
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
        id: t.id,
        timeout: setTimeout(async () => {
          await TodosDb.update({
            ...t,
            complete: true,
            completeDisabled: true,
            completedAt: new Date(),
          });
        }, 2000),
      });
    } else {
      const timeoutObj = timeouts.find((timeout) => timeout.id === t.id);
      if (timeoutObj) {
        clearTimeout(timeoutObj.timeout);
        timeouts = timeouts.filter((timeout) => timeout.id !== timeoutObj.id);
      }
    }
    await TodosDb.update({ ...t, complete: !t.complete });
  };

  const updateTodosOrder = async (result: DropResult) => {
    if (!result.destination) return;

    await TodosDb.updateOrder(
      listId,
      result.source.index,
      result.destination.index,
    );
  };

  const todosToComplete = useMemo(
    () => todos.filter((t) => !t.completeDisabled),
    [todos],
  );
  const completedTodos = useMemo(
    () => todos.filter((t) => t.completeDisabled),
    [todos],
  );

  return {
    todosToComplete,
    completedTodos,
    newTodo,
    selectedTodoList,
    updateTodosOrder,
    handleKeyPressAdd,
    addTodo,
    handleChangeExistingTodo,
    handleChangeNewTodo,
    handleCompleteTodo,
    updateTodo,
    updateTodoData,
    handleInputFocus,
    handleKeyPress,
    handleClickScreen,
  };
};
