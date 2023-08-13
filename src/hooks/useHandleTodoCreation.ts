import { KeyboardEventHandler, useContext, useMemo, useState } from 'react';
import { TodosContext } from 'src/state/todos/TodosProvider';
import { Todo } from 'src/types/main';

export const useHandleTodoCreation = () => {
  const [currentTodo, setCurrentTodo] = useState({} as Todo);
  const {
    todos,
    newTodo,
    selectedTodoList,
    handleChange,
    handleChangeNewTodo,
    handleUpdateTodo,
    handleRemoveTodo,
    handleAddTodo,
    handleCompleteTodo
  } = useContext(TodosContext);

  const [clickScreenFocusHandler, setClickScreenFocusHandler] = useState(false);

  const handleClickScreen = () => {
    document.getElementById('new-todo')?.focus();
    setClickScreenFocusHandler(true);
  };

  const removeFocus = () => {
    setClickScreenFocusHandler(false);
  };

  const handleKeyPress: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter') {
      setClickScreenFocusHandler(true);
      e.preventDefault();
      document.getElementById('new-todo')?.focus();
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
      document.getElementById('new-todo')?.focus();
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
    handleChange,
    handleChangeNewTodo,
    handleCompleteTodo,
    updateTodo,
    handleInputFocus,
    handleKeyPress,
    removeFocus,
    handleClickScreen
  };
};
