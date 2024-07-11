'use server';

import * as ListsService from '@/src/actions/lists.action';
import { Lists } from '@/src/app/components/Lists';
import { ListsProvider } from '@/src/app/provider';
import { json } from '@/src/lib/functions';

export const ListsContainer = async () => {
  const lists = await ListsService.get();

  return (
    <ListsProvider listsDb={json(lists)}>
      <Lists />
    </ListsProvider>
  );
};
