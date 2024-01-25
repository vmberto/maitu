'use client';

/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */

import React from 'react';

import { CompleteTodos } from '@/src/app/todos/components/CompleteTodos';
import { Header } from '@/src/app/todos/components/Header';
import { TodoDetailSlideOver } from '@/src/app/todos/components/TodoDetailSlideOver';
import { Todos } from '@/src/app/todos/components/Todos';
import { TodosContext, useTodos } from '@/src/app/todos/hooks/useTodos';
import type { List, Todo } from '@/types/main';

type TodosContainerProps = {
  list: List;
  todos: Todo[];
};

export const TodosContainer = ({ list, todos }: TodosContainerProps) => {
  const todosState = useTodos(list, todos);

  return (
    <main className="mx-auto my-0 h-full max-w-xl">
      <TodosContext.Provider value={todosState}>
        <Header />

        <Todos />

        <CompleteTodos />

        <TodoDetailSlideOver />
      </TodosContext.Provider>
    </main>
  );
};
