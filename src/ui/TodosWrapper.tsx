import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import TodoInput from '@/components/TodoInput';
import { FC, KeyboardEventHandler, useContext, useState } from 'react';
import { Todo } from '@/types/main';
import Link from 'next/link';
import { TodosContext } from '@/state/todos/TodosProvider';

const TodosWrapper: FC = () => {
  const [currentTodo, setCurrentTodo] = useState({} as Todo);
  const [clickScreenFocusHandler, setClickScreenFocusHandler] = useState(false);
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
      await handleRemoveTodo(t._id);
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

  const todosToComplete = todos.filter((t) => !t.completeDisabled);
  const completedTodos = todos.filter((t) => t.completeDisabled);

  // @Todo: Fix absolute div height (should be the same size as the screen)
  return (
    <div className="relative">
      {clickScreenFocusHandler && (
        <div className="absolute w-full h-screen" onClick={removeFocus}></div>
      )}
      <div className="min-h-screen" onClick={handleClickScreen}>
        <div className="max-w-xl my-0 mx-auto p-5">
          <div className="flex items-center">
            <Link href="..">
              <ArrowLeftIcon
                className={`relative z-10 cursor-pointer h-6 w-6 mr-5 fill-${selectedTodoList.color}`}
              />
            </Link>

            <h1 className="text-2xl font-bold">{selectedTodoList?.title}</h1>
          </div>
          <div id="Todos" className="mt-5 mb-60">
            {todosToComplete.map((t, index) => (
              <TodoInput
                key={t._id}
                id={t._id}
                value={t.title}
                todoData={t}
                handleCompleteTodo={handleCompleteTodo}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyPress}
                onBlur={updateTodo(t)}
                onFocus={handleInputFocus(t)}
                onChange={handleChange(t)}
              />
            ))}
            <TodoInput
              id="new-todo"
              value={newTodo.title}
              onChange={handleChangeNewTodo}
              onFocus={handleInputFocus(newTodo)}
              onBlur={addTodo}
              onKeyDown={handleKeyPressAdd}
            />
          </div>
          {completedTodos.length > 0 && (
            <>
              <div className="flex align-middle text-lg font-semibold mt-5">
                <h2>Complete Todos</h2>
                <span className="text-sm font-semibold ml-auto">{completedTodos.length}</span>
              </div>
              <div id="Todos">
                {completedTodos.map((t, index) => (
                  <TodoInput key={t._id} id={t._id} todoData={t} value={t.title} disabled />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodosWrapper;
