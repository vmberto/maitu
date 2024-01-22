'use client';

import { Lists } from '@/src/app/lists/components/Lists';
import { MaituHeader } from '@/src/app/lists/components/MaituHeader';
import {
  TodoListsContext,
  useTodoLists,
} from '@/src/app/lists/hooks/useTodoLists';
import type { TodoList } from '@/types/main';

type ListsContainerProps = {
  lists: TodoList[];
};

export const ListsContainer = ({ lists }: ListsContainerProps) => {
  const todoListsState = useTodoLists(lists);

  console.log(lists);

  return (
    <TodoListsContext.Provider value={todoListsState}>
      <MaituHeader />
      <Lists />
    </TodoListsContext.Provider>
  );
};
