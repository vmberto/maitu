import { Suspense } from 'react';

import { ListsContainer } from '@/src/app/lists/components/ListsContainer';
import { MaituHeader } from '@/src/app/lists/components/MaituHeader';
import ListsLoading from '@/src/app/lists/loading';

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
