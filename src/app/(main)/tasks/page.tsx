import { Suspense } from 'react';
import { TaskScreen } from '@/src/components/Offline/TaskScreen';
export default function TasksPage() {
  return (
    <Suspense fallback={<p>Opening tasks…</p>}>
      <TaskScreen />
    </Suspense>
  );
}
