import * as ListsService from '@/src/app/api/services/lists.service';
import { ListsContainer } from '@/src/app/lists/components/ListsContainer';
import { json } from '@/src/lib/functions';

export default async function ListsPage() {
  const lists = await ListsService.get();

  return <ListsContainer lists={json(lists)} />;
}
