import { Suspense } from 'react';

import { ListsContainer } from '@/src/app/components/ListsContainer';
import ListsLoading from '@/src/app/components/Loading/ListsLoading';
import { MaituHeader } from '@/src/app/components/MaituHeader';

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
