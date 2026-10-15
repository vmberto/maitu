import type { Task } from '../../types/main';

export function entriesForView(tasks: Task[], mixed: boolean, filter: string, archived: boolean) {
  if (archived) return tasks.filter((task) => !!task.archived);
  if (!mixed) return tasks.filter((task) => !task.parentTaskId && !task.archived);
  return tasks.filter((task) => {
    if (task.archived || task.parentTaskId) return false;
    return filter === 'notes' ? task.type === 'note' : task.type !== 'note';
  });
}
