import { engine } from '#lib/offline';
export async function commitTaskTitle(
  id: string,
  title: string,
  readonly = false,
) {
  if (readonly) return;
  if (!title.trim()) await engine.remove('tasks', id);
  else await engine.update('tasks', id, { title });
}
