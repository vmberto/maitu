import React from 'react';

import * as TodosService from '@/src/app/api/services/todos.service';
import { TodosContainer } from '@/src/app/todos/components/TodosContainer';

type TodosPageProps = {
  searchParams: { listId: string };
};

export default async function TodosPage({ searchParams }: TodosPageProps) {
  const { todos, ...list } = await TodosService.getListTodos(
    searchParams.listId,
  );

  const json = (data: unknown) => JSON.parse(JSON.stringify(data));

  return <TodosContainer list={json(list)} todos={json(todos)} />;
}
