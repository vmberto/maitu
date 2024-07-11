import * as TasksService from '@/src/actions/tasks.action';
import { Header } from '@/src/app/(main)/tasks/components/Header';
import { TaskDetailSlideOver } from '@/src/app/(main)/tasks/components/TaskDetailSlideOver';
import { TasksWrapper } from '@/src/app/(main)/tasks/components/Tasks/TasksWrapper';
import { TasksProvider } from '@/src/app/(main)/tasks/state/provider';
import { json } from '@/src/lib/functions';

type TasksPageProps = {
  searchParams: { listId: string };
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { tasks, ...list } = await TasksService.getListTasks(
    searchParams.listId,
  );

  return (
    <TasksProvider>
      <Header />
      <TasksWrapper list={json(list)} tasks={json(tasks)} />
      <TaskDetailSlideOver />
    </TasksProvider>
  );
}
