import React from 'react';

import * as TodosService from '@/src/actions/todos.service';
import { Header } from '@/src/app/todos/components/Header';
import { TodosWrapper } from '@/src/app/todos/components/TodosContainer/TodosWrapper';
import { TodosProvider } from '@/src/app/todos/state/provider';
import { json } from '@/src/lib/functions';

type TodosPageProps = {
  searchParams: { listId: string };
};

export default async function TodosPage({ searchParams }: TodosPageProps) {
  const { todos, ...list } = await TodosService.getListTodos(
    searchParams.listId,
  );

  return (
    <TodosProvider>
      <Header />
      <TodosWrapper listDb={json(list)} todosDb={json(todos)} />
    </TodosProvider>
  );
}
