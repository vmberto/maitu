'use client';

import { useSearchParams } from 'next/navigation';
import { Header } from '@/src/app/(main)/tasks/components/Header';
import { TaskDetailSlideOver } from '@/src/app/(main)/tasks/components/TaskDetailSlideOver';
import { TasksWrapper } from '@/src/app/(main)/tasks/components/Tasks/TasksWrapper';
import { TasksProvider } from '@/src/app/(main)/tasks/state/provider';
import { Header as TimelineHeader } from '@/src/app/(main)/timeline/components/Header';
import { TimelineWrapper } from '@/src/app/(main)/timeline/components/TimelineWrapper';
import { TimelineProvider } from '@/src/app/(main)/timeline/state/provider';
import { AppLink } from './AppLink';
import { useOffline } from './OfflineProvider';

export function TaskScreen({ timeline = false }: { timeline?: boolean }) {
  const listId = useSearchParams().get('listId') ?? '';
  const { account } = useOffline();
  if (!account?.lists.some((list) => list._id === listId && !list.deleted))
    return (
      <p className="p-5">
        This list is unavailable on this device.{' '}
        <AppLink href="/" className="underline">
          Back to lists
        </AppLink>{' '}
        or sync when online.
      </p>
    );
  if (timeline)
    return (
      <TimelineProvider key={listId} listId={listId}>
        <TimelineHeader />
        <TimelineWrapper />
      </TimelineProvider>
    );
  return (
    <TasksProvider key={listId} listId={listId}>
      <Header />
      <TasksWrapper />
      <TaskDetailSlideOver />
    </TasksProvider>
  );
}
