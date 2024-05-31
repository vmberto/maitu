'use client';

import { useMemo } from 'react';

import { NewTaskInput } from '@/src/app/tasks/components/Tasks/NewTaskInput';
import { TaskInput } from '@/src/app/tasks/components/Tasks/TaskInput';
import { useTasks } from '@/src/app/tasks/state/provider';

export const Tasks = () => {
  const { tasks } = useTasks();

  const incompleteTasks = useMemo(
    () => tasks.filter((t) => !t.completedAt),
    [tasks],
  );

  return (
    <div className="mb-28 px-5 pb-5">
      {incompleteTasks.map((task) => (
        <TaskInput key={task.createdAt} taskData={task} />
      ))}
      <NewTaskInput />
    </div>
  );
};
