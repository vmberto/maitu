import { Suspense } from 'react';

import { ListsContainer } from '@/src/app/lists/components/ListsContainer';
import ListsLoading from '@/src/app/lists/components/Loading/ListsLoading';
import { MaituHeader } from '@/src/app/lists/components/MaituHeader';

export default async function ListsPage() {
  return (
    <>
      <MaituHeader />
      <Suspense fallback={<ListsLoading />}>
        <ListsContainer />
      </Suspense>
    </>
  );
}
