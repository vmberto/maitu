/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import { useRef } from 'react';
import { TodosContext } from 'src/context/TodosContext';
import { useTodos } from 'src/hooks/useTodos';
import { CompleteTodos } from 'src/ui/view/TodosView/components/CompleteTodos';
import { Header } from 'src/ui/view/TodosView/components/Header';
import { Todos } from 'src/ui/view/TodosView/components/Todos';

const TodosView = () => {
  const newTodoInputRef = useRef({} as HTMLTextAreaElement);
  const todosState = useTodos(newTodoInputRef.current);

  const { handleClickScreen, clickScreenFocusHandler, removeFocus } =
    todosState;

  return (
    <TodosContext.Provider value={todosState}>
      <div className="relative min-h-screen" onClick={handleClickScreen}>
        {clickScreenFocusHandler && (
          <div className="absolute h-full w-full" onClick={removeFocus} />
        )}

        <div className="mx-auto my-0 h-full max-w-xl">
          <Header />

          <Todos newTodoInputRef={newTodoInputRef} />

          <CompleteTodos />
        </div>
      </div>
    </TodosContext.Provider>
  );
};

export default TodosView;
