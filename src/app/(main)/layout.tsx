import { Suspense } from 'react';
import ListsLoading from '@/src/app/(main)/components/Loading/ListsLoading';
import { OfflineProvider } from '@/src/components/Offline/OfflineProvider';
import { AppScreen } from '@/src/components/Offline/AppScreen';

export default function MainLayout() {
  return (
    <OfflineProvider>
      <Suspense fallback={<ListsLoading />}>
        <AppScreen />
      </Suspense>
    </OfflineProvider>
  );
}
