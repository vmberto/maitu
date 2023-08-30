import { KeyboardEventHandler, useMemo, useState } from 'react';
import { Todo, TodoList } from 'src/types/main';
import * as TodosDb from 'src/lib/database/todosDb';
import { useRouter } from 'next/router';
import { useLiveQuery } from 'dexie-react-hooks';
import { TextareaChangeEventHandler } from 'src/types/events';

let timeouts = [] as { id: string; timeout: NodeJS.Timeout }[];

export const useTodos = (newTodoInput: HTMLTextAreaElement) => {
  const { listId } = useRouter().query;
  const [currentTodo, setCurrentTodo] = useState({} as Todo);
  const [todos, setTodos] = useState<Todo[]>([] as Todo[]);
  const [selectedTodoList, setSelectedTodoList] = useState<TodoList>({} as TodoList);
  const [newTodo, setNewTodo] = useState<Todo>({} as Todo);

  useLiveQuery(() => {
    (async () => {
      if (listId) {
        const { selectedTodoList, todos } = await TodosDb.get(listId);
        setTodos(todos);
        setSelectedTodoList(selectedTodoList);
      }
    })();
  }, [listId]);

  const [clickScreenFocusHandler, setClickScreenFocusHandler] = useState(false);

  const handleClickScreen = () => {
    newTodoInput.focus();
    setClickScreenFocusHandler(true);
  };

  const removeFocus = () => {
    setClickScreenFocusHandler(false);
  };

  const handleKeyPress: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter') {
      setClickScreenFocusHandler(true);
      e.preventDefault();
      newTodoInput.focus();
    }
  };

  const handleChangeExistingTodo = (todo: Todo) => (e: TextareaChangeEventHandler) => {
    const { value } = e.target;
    const { id } = todo;
    const todosCopy: Todo[] = JSON.parse(JSON.stringify(todos));
    const changedTodo = todosCopy.find((t) => t.id === id);
    if (changedTodo?.id) {
      changedTodo.title = value!;
    }
    setTodos(todosCopy);
  };

  const handleChangeNewTodo = (e: TextareaChangeEventHandler) => {
    const newTodoCopy: Todo = { ...newTodo };
    const { value } = e.target;
    newTodoCopy.title = value!;
    setNewTodo(newTodoCopy);
  };

  const handleInputFocus = (t: Todo) => async () => {
    setClickScreenFocusHandler(true);
    const currentTodo = { ...t };
    setCurrentTodo(currentTodo);
  };

  const updateTodo = (t: Todo) => async () => {
    setClickScreenFocusHandler(false);
    if (t.title.length <= 0) {
      await TodosDb.remove(t.id);
      return;
    }

    if (t.title !== currentTodo.title) {
      await TodosDb.update(t.id, t);
    }
  };

  const addTodo = async () => {
    setClickScreenFocusHandler(false);
    if (newTodo?.title?.length > 0) {
      const addedTodo = {
        listId,
        title: newTodo.title,
        complete: false,
        completeDisabled: false,
        createdAt: new Date()
      } as Todo;
      setNewTodo({ title: '' } as Todo);
      await TodosDb.add(addedTodo);
      newTodoInput.focus();
    }
  };

  const handleKeyPressAdd: KeyboardEventHandler<HTMLTextAreaElement> = async (e) => {
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
          await TodosDb.update(t.id, { ...t, complete: true, completeDisabled: true });
        }, 2000)
      });
    } else {
      const timeoutObj = timeouts.find((timeout) => timeout.id === t.id);
      if (timeoutObj) {
        clearTimeout(timeoutObj.timeout);
        timeouts = timeouts.filter((t) => t.id !== timeoutObj.id);
      }
    }
    await TodosDb.update(t.id, { ...t, complete: !t.complete });
  };

  const todosToComplete = useMemo(() => todos.filter((t) => !t.completeDisabled), [todos]);
  const completedTodos = useMemo(() => todos.filter((t) => t.completeDisabled), [todos]);

  return {
    todosToComplete,
    completedTodos,
    newTodo,
    selectedTodoList,
    clickScreenFocusHandler,
    handleKeyPressAdd,
    addTodo,
    handleChangeExistingTodo,
    handleChangeNewTodo,
    handleCompleteTodo,
    updateTodo,
    handleInputFocus,
    handleKeyPress,
    removeFocus,
    handleClickScreen
  };
};
