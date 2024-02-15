'use server';

import * as ListsService from '@/src/actions/lists.service';
import { Header } from '@/src/app/todos/components/Header';
import { json } from '@/src/lib/functions';

type HeaderContainerProps = {
  listId: string;
};

export const HeaderContainer = async ({ listId }: HeaderContainerProps) => {
  const list = await ListsService.getById(listId);

  return <Header {...json(list)} />;
};
