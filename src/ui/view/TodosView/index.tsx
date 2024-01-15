/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useRef } from 'react';
import { TodosContext, useTodos } from 'src/hooks/useTodos';
import { CompleteTodos } from 'src/ui/view/TodosView/components/CompleteTodos';
import { Header } from 'src/ui/view/TodosView/components/Header';
import { TodoDetailSlideOver } from 'src/ui/view/TodosView/components/TodoDetailSlideOver';
import { Todos } from 'src/ui/view/TodosView/components/Todos';

import type { Todo, TodoList } from '../../../../types/main';

type TodosViewProps = {
  list: TodoList;
  todos: Todo[];
};

const TodosView = ({ list, todos }: TodosViewProps) => {
  const newTodoInputRef = useRef({} as HTMLTextAreaElement);

  const todosState = useTodos(list, todos, newTodoInputRef.current);

  const { handleClickScreen } = todosState;

  if (!newTodoInputRef) {
    return null;
  }

  return (
    <TodosContext.Provider value={todosState}>
      <div className="relative min-h-screen" onClick={handleClickScreen}>
        <div className="mx-auto my-0 h-full max-w-xl">
          <Header />

          <Todos newTodoInputRef={newTodoInputRef} />

          <CompleteTodos />

          <TodoDetailSlideOver />
        </div>
      </div>
    </TodosContext.Provider>
  );
};

export default TodosView;
