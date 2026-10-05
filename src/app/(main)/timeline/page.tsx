import { Suspense } from 'react';
import { TaskScreen } from '@/src/components/Offline/TaskScreen';
export default function TimelinePage() {
  return (
    <Suspense fallback={<p>Opening timeline…</p>}>
      <TaskScreen timeline />
    </Suspense>
  );
}
