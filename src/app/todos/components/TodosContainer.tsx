'use client';

import { useEffect } from 'react';

import { CompleteTodos } from '@/src/app/todos/components/CompleteTodos';
import { Header } from '@/src/app/todos/components/Header';
import { TodoDetailSlideOver } from '@/src/app/todos/components/TodoDetailSlideOver';
import { Todos } from '@/src/app/todos/components/Todos';
import { useTodosStore } from '@/src/app/todos/state/store';
import type { List, Todo } from '@/types/main';

type TodosPageProps = {
  todos: Todo[];
  list: List;
};

export const TodosContainer = ({ todos, list }: TodosPageProps) => {
  const { setList, setTodos } = useTodosStore();

  useEffect(() => {
    setList(list);
    setTodos(todos);
  }, [todos, list, setList, setTodos]);

  return (
    <>
      <Header />
      <section className="mx-auto h-full max-w-xl">
        <Todos />
        <CompleteTodos />
        <TodoDetailSlideOver />
      </section>
    </>
  );
};
