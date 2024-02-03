'use client';

import { Lists } from '@/src/app/lists/components/Lists';
import { MaituHeader } from '@/src/app/lists/components/MaituHeader';
import { ListsProvider } from '@/src/app/lists/provider';
import type { List } from '@/types/main';

type ListsContainerProps = {
  lists: List[];
};

export const ListsContainer = ({ lists }: ListsContainerProps) => {
  return (
    <ListsProvider listsDb={lists}>
      <MaituHeader />
      <Lists />
    </ListsProvider>
  );
};
