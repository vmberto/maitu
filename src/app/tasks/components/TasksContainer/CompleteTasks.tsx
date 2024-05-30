'use client';

import { useMemo } from 'react';

import { TaskInput } from '@/src/app/tasks/components/TasksContainer/TaskInput';
import { useTasks } from '@/src/app/tasks/state/provider';

export const CompleteTasks = () => {
  const { tasks } = useTasks();

  const completeTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.completedAt)
        .sort(
          (a, b) =>
            new Date(b?.completedAt || '').getTime() -
            new Date(a?.completedAt || '').getTime(),
        ),
    [tasks],
  );

  if (!completeTasks.length) {
    return null;
  }

  return (
    <div id="complete-tasks" className="px-5 pb-5">
      <div className="mt-5 flex border-b-2 border-gray-100 align-middle text-lg font-semibold">
        <h2>Complete Tasks</h2>
        <span className="ml-auto text-sm font-semibold">
          {completeTasks.length}
        </span>
      </div>
      <div id="Tasks">
        {completeTasks.map((t) => (
          <TaskInput key={t._id?.toString()} taskData={t} disabled />
        ))}
      </div>
    </div>
  );
};
