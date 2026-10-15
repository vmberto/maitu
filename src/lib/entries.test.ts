import { entriesForView } from './entries';
import type { Task } from '../../types/main';

const tasks = [
  { _id: 'note', type: 'note', archived: true },
  { _id: 'related', parentTaskId: 'note' },
  { _id: 'task' },
  { _id: 'subtask', parentTaskId: 'task' },
  { _id: 'active-note', type: 'note' },
  { _id: 'active-related', parentTaskId: 'active-note' },
  { _id: 'completed-related', parentTaskId: 'active-note', complete: true },
] as Task[];

it('keeps related tasks inside active and archived notes, without exposing regular subtasks', () => {
  expect(entriesForView(tasks, true, 'tasks', false).map((task) => task._id)).toEqual(['task']);
  expect(entriesForView(tasks, true, 'notes', false).map((task) => task._id)).toEqual(['active-note']);
  expect(entriesForView(tasks, true, 'notes', true).map((task) => task._id)).toEqual(['note']);
  expect(entriesForView(tasks, false, 'tasks', false).map((task) => task._id)).toEqual(['task', 'active-note']);
});

 it('keeps archived tasks, notes and related tasks together regardless of the active tab or list type', () => {
  const archived = [
    { _id: 'task', archived: true, complete: true },
    { _id: 'note', type: 'note', archived: true },
    { _id: 'child', parentTaskId: 'task', archived: true },
    { _id: 'active' },
  ] as Task[];
  for (const mixed of [false, true]) {
    for (const filter of ['tasks', 'notes']) {
      expect(entriesForView(archived, mixed, filter, true).map((item) => item._id)).toEqual(['task', 'note', 'child']);
      expect(entriesForView(archived, mixed, filter, false).some((item) => item.archived)).toBe(false);
    }
  }
});
