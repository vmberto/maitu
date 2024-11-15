import { Suspense } from 'react';

import { ListsContainer } from '@/src/app/(main)/components/ListsContainer';
import ListsLoading from '@/src/app/(main)/components/Loading/ListsLoading';
import { MaituHeader } from '@/src/app/(main)/components/MaituHeader';
import SendNotification from '@/src/app/SendNotification';

export default async function ListsPage() {
  return (
    <>
      <MaituHeader />
      <Suspense fallback={<ListsLoading />}>
        <ListsContainer />
        <SendNotification />
      </Suspense>
    </>
  );
}
