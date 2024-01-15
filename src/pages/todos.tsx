import type { NextApiRequest } from 'next';
import { resetServerContext } from 'react-beautiful-dnd';
import { getListTodos } from 'src/api/services/todos.service';
import TodosView from 'src/ui/view/TodosView';

import type { Todo, TodoList } from '../../types/main';

type TodosPageProps = {
  list: TodoList;
  todos: Todo[];
};

export default function Todos({ list, todos }: TodosPageProps) {
  return <TodosView list={list} todos={todos} />;
}

export const getServerSideProps = async (req: NextApiRequest) => {
  resetServerContext();

  const response = await getListTodos(req.query.listId as string);

  const { todos, ...list } = JSON.parse(JSON.stringify(response));

  return {
    props: {
      list,
      todos,
    },
  };
};
