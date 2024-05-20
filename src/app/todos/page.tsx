import * as TodosService from '@/src/actions/todos.service';
import { TodosContainer } from '@/src/app/todos/components/TodosContainer';
import { json } from '@/src/lib/functions';

type TodosPageProps = {
  searchParams: { listId: string };
};

export default async function TodosPage({
  searchParams: { listId },
}: TodosPageProps) {
  const { todos, ...list } = await TodosService.getListTodos(listId);

  return <TodosContainer todos={json(todos)} list={json(list)} />;
}
