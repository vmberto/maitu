import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/router';
import Input from '@/components/Input';
import { useActions } from '@/state/useAction';
import { FC, KeyboardEventHandler, useEffect, useState } from 'react';
import { Todo } from '@/types/TodoList';

interface TodoListWrapperProps {
  existingTodos: Todo[];
  listId: string;
}

const TodosWrapper: FC<TodoListWrapperProps> = ({ existingTodos, listId }) => {
  const router = useRouter();
  const [currentTodo, setCurrentTodo] = useState({} as Todo);
  const [clickScreenFocusHandler, setClickScreenFocusHandler] = useState(false);
  const { actions, state } = useActions(existingTodos, listId);

  const handleClickScreen = () => {
    actions.handleIsAddingTodo(true);
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
    const currentTodo = { ...t };
    setCurrentTodo(currentTodo);
  };

  const updateTodo = (t: Todo, index: number) => async () => {
    setClickScreenFocusHandler(false);
    if (t.title.length <= 0) {
      actions.handleRemoveTodo(index)();
      await fetch(`http://localhost:3000/api/todos`, {
        method: 'DELETE',
        body: JSON.stringify(t)
      });
    } else {
      if (t.title !== currentTodo.title) {
        await fetch(`http://localhost:3000/api/todos`, {
          method: 'POST',
          body: JSON.stringify(t)
        });
      }
    }
  };

  const addTodo = () => {
    setClickScreenFocusHandler(false);
    if (state.newTodo?.title?.length > 0) {
      actions.handleAddTodo();
      document.getElementById('new-todo')?.focus();
    }
  };

  const handleKeyPressAdd: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTodo();
    }
  };

  return (
    <>
      {clickScreenFocusHandler && (
        <div className="absolute w-full h-full" onClick={removeFocus}></div>
      )}
      <div className="h-screen" onClick={handleClickScreen}>
        <div className="max-w-xl my-0 mx-auto p-5">
          <div className="flex items-center">
            <ArrowLeftIcon
              className="cursor-pointer h-8 w-8 mr-5"
              onClick={async (e) => {
                e.stopPropagation();
                await router.push('..');
              }}
            />
            <h1 className="text-4xl">Lista 1</h1>
          </div>

          <div id="Todos" className="mt-10">
            {state.todos.map((t, index) => (
              <Input
                key={t._id}
                id={t._id}
                value={t.title}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyPress}
                onBlur={updateTodo(t, index)}
                onFocus={handleInputFocus(t)}
                onChange={actions.handleChange(index)}
              />
            ))}
            <Input
              id="new-todo"
              value={state.newTodo.title}
              onChange={actions.handleChangeNewTodo}
              onFocus={handleInputFocus(state.newTodo)}
              onBlur={addTodo}
              onKeyDown={handleKeyPressAdd}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default TodosWrapper;
