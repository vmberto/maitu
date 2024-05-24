'use client';

import React, { useEffect } from 'react';

import { TodoDetailSlideOver } from '@/src/app/todos/components/TodoDetailSlideOver';
import { CompleteTodos } from '@/src/app/todos/components/TodosContainer/CompleteTodos';
import { Todos } from '@/src/app/todos/components/TodosContainer/Todos';
import { useTodos } from '@/src/app/todos/state/provider';
import type { List, Todo } from '@/types/main';

type TodosWrapperProps = {
  listDb: List;
  todosDb: Todo[];
};

export const TodosWrapper = ({ todosDb, listDb }: TodosWrapperProps) => {
  const { handleSetInitialState } = useTodos();

  useEffect(() => {
    handleSetInitialState(todosDb, listDb);
  }, []);

  return (
    <section className="mx-auto h-full max-w-xl">
      <Todos />
      <CompleteTodos />
      <TodoDetailSlideOver />
    </section>
  );
};
