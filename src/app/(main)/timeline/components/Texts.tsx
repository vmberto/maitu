'use client';

import { useMemo } from 'react';

import { useTimeline } from '@/src/app/(main)/timeline/state/provider';
import { formatDate } from '@/src/lib/functions';
import type { Task } from '@/types/main';

const groupTasksByDate = (tasks: Task[]): Record<string, Task[]> => {
  const grouped = tasks.reduce(
    (groups, task) => {
      const isoKey = task.createdAt.slice(0, 10); // ex: "2025-06-05"
      return {
        ...groups,
        [isoKey]: [...(groups[isoKey] || []), task],
      };
    },
    {} as Record<string, Task[]>,
  );

  const sorted = Object.entries(grouped).sort(
    ([a], [b]) => new Date(b).getTime() - new Date(a).getTime(),
  );

  return Object.fromEntries(
    sorted.map(([key, value]) => [formatDate(key, true), value]),
  );
};

export const Texts = () => {
  const { tasks } = useTimeline();
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
