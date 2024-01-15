import { resetServerContext } from 'react-beautiful-dnd';
import * as ListsService from 'src/api/services/lists.service';
import TodoListsView from 'src/ui/view/TodoListsView';

import type { TodoList } from '../../types/main';

type ListsProps = {
  lists: TodoList[];
};

export default function Lists({ lists }: ListsProps) {
  return <TodoListsView lists={lists} />;
}

export const getServerSideProps = async () => {
  resetServerContext();

  const lists = await ListsService.get();

  return {
    props: {
      lists: JSON.parse(JSON.stringify(lists)),
    },
  };
};
