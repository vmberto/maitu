import { useEffect } from 'react';

import { NewTaskInput } from '@/src/app/(main)/tasks/components/Tasks/NewTaskInput';
import { TaskInput } from '@/src/app/(main)/tasks/components/Tasks/TaskInput';
import { useTasks } from '@/src/app/(main)/tasks/state/provider';
import { Typography } from '@/src/components/Typography';

export const SubTasksWrapper = () => {
  const { handleGetSubtasks, subtasks } = useTasks();

  useEffect(() => {
    handleGetSubtasks();
  }, []);

  return (
    <section className="relative h-fit rounded-2xl bg-gray-100 p-4">
      <Typography as="h1">Subtasks</Typography>

      {subtasks.map((task) => (
        <TaskInput key={task.createdAt} taskData={task} />
      ))}

      <NewTaskInput />
    </section>
  );
};
