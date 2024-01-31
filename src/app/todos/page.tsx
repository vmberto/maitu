import React from 'react';

import * as TodosService from '@/src/actions/todos.service';
import { TodosContainer } from '@/src/app/todos/components/TodosContainer';
import { json } from '@/src/lib/functions';

type TodosPageProps = {
  searchParams: { listId: string };
};

export default async function TodosPage({ searchParams }: TodosPageProps) {
  const { todos, ...list } = await TodosService.getListTodos(
    searchParams.listId,
  );

  return <TodosContainer list={json(list)} todos={json(todos)} />;
}
