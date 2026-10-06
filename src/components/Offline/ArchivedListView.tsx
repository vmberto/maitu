'use client';
import { useSearchParams } from 'next/navigation';
import { AppHeader } from '@/src/components/AppHeader';
import { TaskMapButton } from '@/src/components/TaskMap/TaskMapButton';
import { normalizeLocation } from '@/src/lib/location';
import { AppLink } from './AppLink';
import type { List, Task } from '@/types/main';
export function ArchivedListView({
  list,
  tasks,
}: {
  list: List;
  tasks: Task[];
}) {
  const focused = useSearchParams().get('taskId');
  return (
    <>
      <AppHeader
        list={list}
        backHref="/archived"
        actions={<TaskMapButton list={list} tasks={tasks} />}
      />
      <main className="mx-auto max-w-xl px-5 py-4">
        <p className="mb-4 text-sm text-gray-500">Archived · Read only</p>
        {tasks
          .filter((task) => !task.parentTaskId)
          .map((task) => (
            <details
              key={String(task._id)}
              open={String(task._id) === focused}
              className="mb-3 rounded-lg bg-panel p-3"
            >
              <summary className="cursor-pointer font-medium">
                {task.complete ? '✓ ' : ''}
                {task.title}
              </summary>
              {task.description && (
                <p className="mt-3 whitespace-pre-wrap text-gray-600">
                  {task.description}
                </p>
              )}
              {task.tags?.length ? (
                <p className="mt-2 text-sm text-gray-500">
                  {task.tags.join(', ')}
                </p>
              ) : null}
              <ul className="mt-2 space-y-2 text-sm text-gray-600">
                {tasks
                  .filter(
                    (subtask) =>
                      String(subtask.parentTaskId) === String(task._id),
                  )
                  .map((subtask) => (
                    <li key={String(subtask._id)}>
                      {subtask.complete ? '✓ ' : ''}
                      {subtask.title}
                      {subtask.description && <p>{subtask.description}</p>}
                    </li>
                  ))}
              </ul>
              {normalizeLocation(task.location) && (
                <AppLink
                  className="mt-3 inline-block text-sm text-primary"
                  href={`/tasks/map?listId=${encodeURIComponent(String(list._id))}&taskId=${encodeURIComponent(String(task._id))}`}
                >
                  See on Map
                </AppLink>
              )}
            </details>
          ))}
        {!tasks.length && (
          <p className="py-4 text-gray-500">No tasks in this list.</p>
        )}
      </main>
    </>
  );
}
