'use client';

/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */

import React, { useRef } from 'react';

import { CompleteTodos } from '@/src/app/todos/components/CompleteTodos';
import { Header } from '@/src/app/todos/components/Header';
import { TodoDetailSlideOver } from '@/src/app/todos/components/TodoDetailSlideOver';
import { Todos } from '@/src/app/todos/components/Todos';
import { TodosContext, useTodos } from '@/src/app/todos/hooks/useTodos';
import type { Todo, TodoList } from '@/types/main';

type TodosContainerProps = {
  list: TodoList;
  todos: Todo[];
};

export const TodosContainer = ({ list, todos }: TodosContainerProps) => {
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
