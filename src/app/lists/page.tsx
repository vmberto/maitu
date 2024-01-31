import * as ListsService from '@/src/actions/lists.service';
import { ListsContainer } from '@/src/app/lists/components/ListsContainer';
import { json } from '@/src/lib/functions';

export default async function ListsPage() {
  const lists = await ListsService.get();

  return <ListsContainer lists={json(lists)} />;
}
