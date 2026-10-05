'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Lists } from '@/src/app/(main)/components/Lists/Lists';
import { MaituHeader } from '@/src/app/(main)/components/MaituHeader';
import { useSlideOver } from '@/src/providers/slideover.provider';
import { TaskScreen } from './TaskScreen';

export function AppScreen() {
  const pathname = usePathname();
  const listId = useSearchParams().get('listId');
  const { handleCloseSlideOver, handleClearSlideOverData } = useSlideOver();
  useEffect(() => {
    handleCloseSlideOver();
    handleClearSlideOverData();
  }, [pathname, listId, handleCloseSlideOver, handleClearSlideOverData]);
  if (pathname === '/tasks' || pathname === '/timeline')
    return <TaskScreen timeline={pathname === '/timeline'} />;
  return (
    <>
      <MaituHeader />
      <Lists />
    </>
  );
}
