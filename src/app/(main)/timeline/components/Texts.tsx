'use client';

import { useMemo } from 'react';

import { useTasks } from '@/src/app/(main)/timeline/state/provider';
import { formatDate } from '@/src/lib/functions';
import type { Task } from '@/types/main';

const groupTasksByDate = (tasks: Task[]): Record<string, Task[]> => {
  const grouped = tasks.reduce(
    (groups, task) => {
      const date = formatDate(task.createdAt, true); // Format date as DD/MM/YYYY
      return {
        ...groups,
        [date]: [...(groups[date] || []), task],
      };
    },
    {} as Record<string, Task[]>,
  );

  return Object.fromEntries(
    Object.entries(grouped).sort(([dateA], [dateB]) => {
      return new Date(dateA) < new Date(dateB) ? 1 : -1;
    }),
  );
};

export const Texts = () => {
  const { tasks } = useTasks();
  const groupedTasks = useMemo(() => groupTasksByDate(tasks), [tasks]);

  return (
    <div>
      {Object.keys(groupedTasks).map((date) => (
        <div key={date} className="my-6">
          <h2 className="mb-4 text-xl font-semibold">{date}</h2>
          <div className="space-y-2">
            {groupedTasks[date].map((task) => (
              <div
                key={task.createdAt?.toString()}
                className="h-fit rounded-2xl bg-gray-100 p-4"
              >
                {task.title}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
