'use client';

import { DescriptionSection } from '@/src/app/tasks/components/TaskDetailSlideOver/components/DescriptionSection';
import { TaskDetailTitle } from '@/src/app/tasks/components/TaskDetailSlideOver/components/TaskDetailTitle';
import { SubTasksWrapper } from '@/src/app/tasks/components/TaskDetailSlideOver/Subtasks/SubTasksWrapper';
import { useTasks } from '@/src/app/tasks/state/provider';
import SlideOver from '@/src/components/SlideOver';
import { useModals } from '@/src/providers/slideover.provider';
import type { Task } from '@/types/main';

export const TaskDetailSlideOver = () => {
  const { handleUpdateTask } = useTasks();
  const {
    modalData: taskData,
    isOpen,
    handleCloseSlideOver,
  } = useModals<Task>();

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
        <SubTasksWrapper />
      </div>
    </SlideOver>
  );
};
