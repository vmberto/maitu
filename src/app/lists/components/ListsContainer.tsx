'use server';

import { Lists } from '@/src/app/lists/components/Lists';
import { ListsProvider } from '@/src/app/lists/provider';
import { json } from '@/src/lib/functions';
import * as ListsService from '@/src/server/lists.service';

export const ListsContainer = async () => {
  const lists = await ListsService.get();

  return (
    <ListsProvider listsDb={json(lists)}>
      <Lists />
    </ListsProvider>
  );
};
