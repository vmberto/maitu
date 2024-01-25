'use client';

import { Lists } from '@/src/app/lists/components/Lists';
import { MaituHeader } from '@/src/app/lists/components/MaituHeader';
import { ListsContext, useLists } from '@/src/app/lists/hooks/useLists';
import type { List } from '@/types/main';

type ListsContainerProps = {
  lists: List[];
};

export const ListsContainer = ({ lists }: ListsContainerProps) => {
  const listsState = useLists(lists);

  return (
    <ListsContext.Provider value={listsState}>
      <MaituHeader />
      <Lists />
    </ListsContext.Provider>
  );
};
