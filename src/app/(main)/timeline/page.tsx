import * as TasksService from '@/src/actions/tasks.action';
import { Header } from '@/src/app/(main)/timeline/components/Header';
import { TimelineWrapper } from '@/src/app/(main)/timeline/components/TimelineWrapper';
import { TimelineProvider } from '@/src/app/(main)/timeline/state/provider';
import { json } from '@/src/lib/functions';

type TasksPageProps = {
  searchParams: { listId: string };
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { tasks, ...list } = await TasksService.getListTasks(
    searchParams.listId,
  );

  return (
    <TimelineProvider>
      <Header />
      <TimelineWrapper list={json(list)} tasks={json(tasks)} />
    </TimelineProvider>
  );
}
