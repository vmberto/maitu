import type { Task } from '../../types/main';

export function entriesForView(tasks: Task[], mixed: boolean, filter: string, archived: boolean) {
  if (!mixed) return tasks.filter((task) => !task.parentTaskId && !task.archived);
  const noteIds = new Set(tasks.filter((task) => task.type === 'note').map((task) => String(task._id)));
  return tasks.filter((task) => {
    if (archived) return task.type === 'note' && !!task.archived;
    if (task.archived || (task.parentTaskId && !noteIds.has(String(task.parentTaskId)))) return false;
    return filter === 'notes' ? task.type === 'note' : task.type !== 'note';
  });
}
