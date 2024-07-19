'use client';

import { Suspense } from 'react';

import { DescriptionSection } from '@/src/app/(main)/tasks/components/TaskDetailSlideOver/components/DescriptionSection';
import { TaskDetailTitle } from '@/src/app/(main)/tasks/components/TaskDetailSlideOver/components/TaskDetailTitle';
import { SubTasksWrapper } from '@/src/app/(main)/tasks/components/TaskDetailSlideOver/Subtasks/SubTasksWrapper';
import { useTasks } from '@/src/app/(main)/tasks/state/provider';
import { SlideOver } from '@/src/components/SlideOver/SlideOver';
import { useSlideOver } from '@/src/providers/slideover.provider';
import type { Task } from '@/types/main';

export const TaskDetailSlideOver = () => {
  const { handleUpdateTask } = useTasks();
  const {
    modalData: taskData,
    isOpen,
    handleCloseSlideOver,
  } = useSlideOver<Task>();

  return (
    <SlideOver
      title={<TaskDetailTitle taskData={taskData} />}
      open={isOpen}
      onClose={handleCloseSlideOver}
    >
      <div className="flex flex-col gap-4">
        {taskData && (
          <DescriptionSection
            taskData={taskData}
            updateTaskData={handleUpdateTask}
          />
        )}
        <Suspense fallback="blablbal">
          <SubTasksWrapper />
        </Suspense>
      </div>
    </SlideOver>
  );
};
