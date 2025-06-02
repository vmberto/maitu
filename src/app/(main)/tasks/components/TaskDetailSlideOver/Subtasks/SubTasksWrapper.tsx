import { useEffect } from 'react';

import { NewTaskInput } from '@/src/app/(main)/tasks/components/Tasks/NewTaskInput';
import { TaskInput } from '@/src/app/(main)/tasks/components/Tasks/TaskInput';
import { TaskSkeleton } from '@/src/app/(main)/tasks/loading';
import { useTasks } from '@/src/app/(main)/tasks/state/provider';
import { Typography } from '@/src/components/Typography/Typography';

export const SubTasksWrapper = () => {
  const { fetchSubtasks, subtasks, fetchingSubtasks } = useTasks();

  useEffect(() => {
    fetchSubtasks();
  }, []);

  return (
    <section className="relative h-fit rounded-2xl bg-gray-100 p-4">
      <div className="flex items-center">
        <Typography as="h1">Subtasks</Typography>
        {subtasks.length > 0 && (
          <Typography as="h4" className="ml-auto text-sm font-semibold">
            {subtasks.filter((st) => st.complete).length} / {subtasks.length}
          </Typography>
        )}
      </div>

      {subtasks.map((task) => (
        <TaskInput key={`${task._id}-${task.createdAt}`} taskData={task} />
      ))}

      {fetchingSubtasks &&
        [1, 2, 3, 4].map((skeleton) => <TaskSkeleton key={skeleton} />)}

      {!fetchingSubtasks && <NewTaskInput />}
    </section>
  );
};
