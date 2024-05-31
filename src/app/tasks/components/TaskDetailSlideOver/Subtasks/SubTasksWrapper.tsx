import { useEffect } from 'react';

import { NewTaskInput } from '@/src/app/tasks/components/Tasks/NewTaskInput';
import { TaskInput } from '@/src/app/tasks/components/Tasks/TaskInput';
import { useTasks } from '@/src/app/tasks/state/provider';

export const SubTasksWrapper = () => {
  const { handleGetSubtasks, subtasks } = useTasks();

  useEffect(() => {
    handleGetSubtasks();
  }, []);

  return (
    <section className="mx-auto h-full max-w-xl">
      {subtasks.map((task) => (
        <TaskInput key={task.createdAt} taskData={task} />
      ))}
      <NewTaskInput />
    </section>
  );
};
