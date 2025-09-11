'use client';

import { useMemo } from 'react';

import { useTimeline } from '@/src/app/(main)/timeline/state/provider';
import { formatDate, formatTime } from '@/src/lib/functions';
import type { Task } from '@/types/main';

const groupTasksByDate = (tasks: Task[]): Record<string, Task[]> => {
  const grouped = tasks.reduce(
    (groups, task) => {
      const isoKey = task.createdAt.slice(0, 10);
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
    <div className="px-4 py-6">
      {Object.entries(groupedTasks).map(([date, dayTasks]) => (
        <div key={date} className="my-2">
          <h2 className="mb-4 text-2xl font-bold text-gray-800">{date}</h2>
          <div className="space-y-3">
            {dayTasks.map((task) => {
              const time = formatTime(task.createdAt);
              return (
                <div
                  key={task.createdAt?.toString()}
                  className="group relative w-fit max-w-prose rounded-2xl bg-gray-100 p-4 pt-6 shadow-sm transition hover:shadow-md"
                >
                  <p className="mt-2 text-gray-800">{task.title}</p>
                  <div className="absolute left-3.5 top-3 text-xs text-gray-500">
                    {time}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
