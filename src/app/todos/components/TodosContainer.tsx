'use server';

import * as TodosService from '@/src/actions/todos.service';
import { Todos } from '@/src/app/todos/components/Todos';
import { json } from '@/src/lib/functions';

type TodosProps = {
  listId: string;
};

export const TodosContainer = async ({ listId }: TodosProps) => {
  const todos = await TodosService.get(listId);

  return <Todos todos={json(todos)} />;
};
