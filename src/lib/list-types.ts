import type { Task } from '../../types/main';

export function entryType(item: Pick<Task, 'type' | 'parentTaskId'>, listType: string) {
  return item.type ?? ((listType === 'notes' || listType === 'timeline') && !item.parentTaskId ? 'note' : 'task');
}

export function listTypeError(items: Pick<Task, 'type' | 'parentTaskId'>[], current: string, target: string) {
  if (target === current || target === 'mixed') return '';
  if (target === 'timeline') return 'Timeline must be selected when creating a list.';
  if (target === 'notes' && items.some((item) => entryType(item, current) === 'task'))
    return 'Remove all tasks before changing this list to Notes, or choose Tasks & Notes.';
  if (['tasks', 'places'].includes(target) && items.some((item) => entryType(item, current) === 'note'))
    return `Remove all notes before changing this list to ${target === 'places' ? 'Places List' : 'Tasks'}, or choose Tasks & Notes.`;
  return '';
}
