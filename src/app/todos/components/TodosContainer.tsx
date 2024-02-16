'use client';

import React from 'react';

import { CompleteTodos } from '@/src/app/todos/components/CompleteTodos';
import { Header } from '@/src/app/todos/components/Header';
import { TodoDetailSlideOver } from '@/src/app/todos/components/TodoDetailSlideOver';
import { Todos } from '@/src/app/todos/components/Todos';
import { TodosProvider } from '@/src/app/todos/provider';
import type { List, Todo } from '@/types/main';

type TodosContainerProps = {
  list: List;
  todos: Todo[];
};

export const TodosContainer = ({ list, todos }: TodosContainerProps) => (
  <main className="mx-auto my-0 h-full max-w-xl">
    <TodosProvider listDb={list} todosDb={todos}>
      <Header />

      <Todos />

      <CompleteTodos />

      <TodoDetailSlideOver />
    </TodosProvider>
  </main>
);
