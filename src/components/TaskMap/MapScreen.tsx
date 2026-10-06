'use client';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useOffline } from '@/src/components/Offline/OfflineProvider';
import { AppLink } from '@/src/components/Offline/AppLink';
import { AppHeader } from '@/src/components/AppHeader';
import { TaskMapButton } from './TaskMapButton';
import { normalizeLocation } from '@/src/lib/location';
import type { Task, List } from '@/types/main';
const TaskMapView = dynamic(() => import('./TaskMapView'), {
  ssr: false,
  loading: () => (
    <div
      className="h-[calc(100dvh-3rem)] animate-pulse bg-panel motion-reduce:animate-none"
      aria-label="Loading map"
      role="status"
    />
  ),
});
export function MapScreen() {
  const { account } = useOffline();
  const params = useSearchParams();
  const listId = params.get('listId');
  const focusTaskId = params.get('taskId');
  const list = account?.lists.find(
    (list) => list._id === listId && !list.deleted,
  ) as List | undefined;
  if (!list)
    return (
      <p className="p-5">
        This list is unavailable on this device.{' '}
        <AppLink href="/" className="underline">
          Back to lists
        </AppLink>
      </p>
    );
  const tasks = (account?.tasks ?? []).filter(
    (task) =>
      !task.deleted &&
      String((task as Task).listId) === listId &&
      normalizeLocation((task as Task).location),
  ) as Task[];
  return (
    <>
      <AppHeader
        list={list}
        actions={<TaskMapButton list={list} tasks={tasks} />}
      />
      <TaskMapView
        key={`${listId}:${focusTaskId ?? 'all'}`}
        tasks={tasks}
        focusTaskId={focusTaskId}
      />
    </>
  );
}
