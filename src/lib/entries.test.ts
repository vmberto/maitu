import { entriesForView } from './entries';
import type { Task } from '../../types/main';

const tasks = [
  { _id: 'note', type: 'note', archived: true },
  { _id: 'related', parentTaskId: 'note' },
  { _id: 'task' },
  { _id: 'subtask', parentTaskId: 'task' },
  { _id: 'active-note', type: 'note' },
] as Task[];

it('keeps related tasks visible when their note is archived, without exposing regular subtasks', () => {
  expect(entriesForView(tasks, true, 'tasks', false).map((task) => task._id)).toEqual(['related', 'task']);
  expect(entriesForView(tasks, true, 'notes', false).map((task) => task._id)).toEqual(['active-note']);
  expect(entriesForView(tasks, true, 'notes', true).map((task) => task._id)).toEqual(['note']);
  expect(entriesForView(tasks, false, 'tasks', false).map((task) => task._id)).toEqual(['task', 'active-note']);
});
