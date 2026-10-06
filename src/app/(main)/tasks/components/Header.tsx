'use client';
import { TaskMapButton } from '@/src/components/TaskMap/TaskMapButton';
import { AppHeader } from '@/src/components/AppHeader';
import { useTasks } from '@/src/app/(main)/tasks/state/provider';
export const Header = () => {
  const { selectedList, tasks } = useTasks();
  return (
    <AppHeader
      list={selectedList}
      actions={<TaskMapButton list={selectedList} tasks={tasks} />}
    />
  );
};
