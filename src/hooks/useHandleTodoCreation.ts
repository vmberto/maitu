import { KeyboardEventHandler, useMemo, useState } from 'react';
import { useTodos } from 'src/state/todos/useTodos';
import { Todo } from 'src/types/main';

export const useHandleTodoCreation = (newTodoInput: HTMLTextAreaElement) => {
  const [currentTodo, setCurrentTodo] = useState({} as Todo);
  const {
    todos,
    newTodo,
    selectedTodoList,
    handleChangeExistingTodo,
    handleChangeNewTodo,
    handleUpdateTodo,
    handleRemoveTodo,
    handleAddTodo,
    handleCompleteTodo
  } = useTodos();

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

  const handleInputFocus = (t: Todo) => async () => {
    setClickScreenFocusHandler(true);
    const currentTodo = { ...t };
    setCurrentTodo(currentTodo);
  };

  const updateTodo = (t: Todo) => async () => {
    setClickScreenFocusHandler(false);
    if (t.title.length <= 0) {
      await handleRemoveTodo(t.id);
    } else {
      if (t.title !== currentTodo.title) {
        await handleUpdateTodo(t);
      }
    }
  };

  const addTodo = async () => {
    setClickScreenFocusHandler(false);
    if (newTodo?.title?.length > 0) {
      await handleAddTodo();
      newTodoInput.focus();
    }
  };

  const handleKeyPressAdd: KeyboardEventHandler<HTMLTextAreaElement> = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await addTodo();
    }
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
