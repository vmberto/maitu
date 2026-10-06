'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Lists } from '@/src/app/(main)/components/Lists/Lists';
import { MaituHeader } from '@/src/app/(main)/components/MaituHeader';
import { useSlideOver } from '@/src/providers/slideover.provider';
import { MapScreen } from '@/src/components/TaskMap/MapScreen';
import { useOffline } from './OfflineProvider';
import type { Task } from '@/types/main';
import { TaskScreen } from './TaskScreen';

export function AppScreen() {
  const pathname = usePathname();
  const params = useSearchParams();
  const listId = params.get('listId');
  const taskId = params.get('taskId');
  const { account } = useOffline();
  const previousRoute = useRef('');
  const { handleCloseSlideOver, handleClearSlideOverData, openSlideOver } =
    useSlideOver();
  useEffect(() => {
    const route = JSON.stringify([pathname, listId, taskId]);
    if (previousRoute.current === route) return;
    previousRoute.current = route;
    handleCloseSlideOver();
    handleClearSlideOverData();
    if (pathname === '/tasks' && taskId) {
      const task = account?.tasks.find(
        (task) =>
          task._id === taskId &&
          !task.deleted &&
          String((task as Task).listId) === listId,
      );
      if (task) openSlideOver(task);
    }
  }, [
    pathname,
    listId,
    taskId,
    account,
    handleCloseSlideOver,
    handleClearSlideOverData,
    openSlideOver,
  ]);
  if (pathname === '/tasks/map') return <MapScreen />;
  if (pathname === '/tasks' || pathname === '/timeline')
    return <TaskScreen timeline={pathname === '/timeline'} />;
  return (
    <>
      <MaituHeader />
      <Lists />
    </>
  );
}
