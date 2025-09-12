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
      {Object.entries(groupedTasks).map(([date, dayTasks], index) => (
        <div key={date} className={index === 0 ? 'mb-8 mt-2' : 'my-8'}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{date}</h2>
          <div className="space-y-4">
            {dayTasks.map((task) => {
              const time = formatTime(task.createdAt);
              return (
                <div key={task.createdAt?.toString()} className="max-w-prose">
                  <div className="mb-1 text-xs text-gray-500">{time}</div>
                  <p className="text-gray-800 leading-relaxed">{task.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
