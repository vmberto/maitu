'use client';

import { DescriptionSection } from '@/src/app/(main)/tasks/components/TaskDetailSlideOver/components/DescriptionSection';
import { TaskDetailTitle } from '@/src/app/(main)/tasks/components/TaskDetailSlideOver/components/TaskDetailTitle';
import { SubTasksWrapper } from '@/src/app/(main)/tasks/components/TaskDetailSlideOver/Subtasks/SubTasksWrapper';
import { TagsWrapper } from '@/src/app/(main)/tasks/components/TaskDetailSlideOver/Tags/TagsWrapper';
import { useTasks } from '@/src/app/(main)/tasks/state/provider';
import { SlideOver } from '@/src/components/SlideOver/SlideOver';
import { useSlideOver } from '@/src/providers/slideover.provider';
import type { Task } from '@/types/main';

export const TaskDetailSlideOver = () => {
  const { handleUpdateTask, selectedList } = useTasks();
  const {
    modalData: taskData,
    isOpen,
    handleCloseSlideOver,
  } = useSlideOver<Task>();

  return (
    <SlideOver
      title={
        <TaskDetailTitle taskData={taskData} listColor={selectedList?.color} />
      }
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
        {taskData && (
          <TagsWrapper listColor={selectedList?.color} taskData={taskData} />
        )}
      </div>
    </SlideOver>
  );
};
