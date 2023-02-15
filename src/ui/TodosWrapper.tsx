import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/router';
import TodoInput from '@/components/TodoInput';
import { useActions } from '@/state/todos/useAction';
import { FC, KeyboardEventHandler, useState } from 'react';
import { Todo } from '@/types/main';

interface TodoWrapperProps {
  existingTodos: Todo[];
  listId: string;
  listTitle: string;
}

const TodosWrapper: FC<TodoWrapperProps> = ({ listTitle, existingTodos, listId }) => {
  const router = useRouter();
  const [currentTodo, setCurrentTodo] = useState({} as Todo);
  const [clickScreenFocusHandler, setClickScreenFocusHandler] = useState(false);
  const { actions, state } = useActions(existingTodos, listId);

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

  const updateTodo = (t: Todo, index: number) => async () => {
    setClickScreenFocusHandler(false);
    if (t.title.length <= 0) {
      await actions.handleRemoveTodo(t._id, index);
    } else {
      if (t.title !== currentTodo.title) {
        await actions.handleUpdateTodo(t);
      }
    }
  };

  const addTodo = async () => {
    setClickScreenFocusHandler(false);
    if (state.newTodo?.title?.length > 0) {
      await actions.handleAddTodo();
      document.getElementById('new-todo')?.focus();
    }
  };

  const handleKeyPressAdd: KeyboardEventHandler<HTMLTextAreaElement> = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await addTodo();
    }
  };

  // @Todo: Fix absolute div height (should be the same size as the screen)
  return (
    <div className="relative">
      {clickScreenFocusHandler && (
        <div className="absolute w-full h-screen" onClick={removeFocus}></div>
      )}
      <div className="min-h-screen" onClick={handleClickScreen}>
        <div className="max-w-xl my-0 mx-auto p-5">
          <div className="flex items-center">
            <ArrowLeftIcon
              className="relative z-10 cursor-pointer h-6 w-6 mr-5 fill-primary"
              onClick={async (e) => {
                e.stopPropagation();
                await router.push('..');
              }}
            />
            <h1 className="text-2xl font-semibold">{listTitle}</h1>
          </div>
          <div id="Todos" className="mt-5 mb-60">
            {state.todos.map((t, index) => (
              <TodoInput
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
            <TodoInput
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
    </div>
  );
};

export default TodosWrapper;
