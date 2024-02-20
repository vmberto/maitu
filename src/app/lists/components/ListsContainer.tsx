'use server';

import * as ListsService from '@/src/actions/lists.service';
import { Lists } from '@/src/app/lists/components/Lists';
import { ListsProvider } from '@/src/app/lists/provider';
import { json } from '@/src/lib/functions';
import { ModalsProvider } from '@/src/providers/slideover.provider';

export const ListsContainer = async () => {
  const lists = await ListsService.get();

  return (
    <ListsProvider listsDb={json(lists)}>
      <ModalsProvider>
        <Lists />
      </ModalsProvider>
    </ListsProvider>
  );
};
