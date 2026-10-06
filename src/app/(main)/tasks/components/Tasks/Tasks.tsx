'use client';

import { useMemo } from 'react';
import { useScrollBatch } from '@/src/components/ScrollBatch';

import { NewTaskInput } from '@/src/app/(main)/tasks/components/Tasks/NewTaskInput';
import { TaskInput } from '@/src/app/(main)/tasks/components/Tasks/TaskInput';
import { useTasks } from '@/src/app/(main)/tasks/state/provider';

export const Tasks = () => {
  const { tasks, pendingCompletionIds } = useTasks();

  const incompleteTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          !t.completedAt || pendingCompletionIds.has(t._id?.toString() ?? ''),
      ),
    [tasks, pendingCompletionIds],
  );

  const { visibleCount, loader } = useScrollBatch(incompleteTasks.length);

  return (
    <div className="mb-28 px-5 pb-5">
      {incompleteTasks.slice(0, visibleCount).map((task) => (
        <TaskInput key={task._id?.toString()} taskData={task} />
      ))}
      {loader}
      <NewTaskInput />
    </div>
  );
};
