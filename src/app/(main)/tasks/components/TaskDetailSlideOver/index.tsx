'use client';

import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import React, { useState } from 'react';

import { DescriptionSection } from '@/src/app/(main)/tasks/components/TaskDetailSlideOver/components/DescriptionSection';
import { TaskDetailTitle } from '@/src/app/(main)/tasks/components/TaskDetailSlideOver/components/TaskDetailTitle';
import { SubTasksWrapper } from '@/src/app/(main)/tasks/components/TaskDetailSlideOver/Subtasks/SubTasksWrapper';
import { TagsWrapper } from '@/src/app/(main)/tasks/components/TaskDetailSlideOver/Tags/TagsWrapper';
import { useTasks } from '@/src/app/(main)/tasks/state/provider';
import { SlideOver } from '@/src/components/SlideOver/SlideOver';
import { HexColors } from '@/src/lib/colors';
import { useSlideOver } from '@/src/providers/slideover.provider';
import type { Task } from '@/types/main';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export const TaskDetailSlideOver = () => {
  const { handleUpdateTask, handleCloneTask, selectedList, loadingAction } =
    useTasks();
  const [showTaskSettings, setShowTaskSettings] = useState(false);
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
      <div className="flex h-full flex-col gap-4">
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
        <div className="mt-auto text-center">
          <button
            type="button"
            className="text-gray-400"
            onClick={() => setShowTaskSettings(!showTaskSettings)}
          >
            Task Settings{' '}
            <ChevronDownIcon className="mb-1 mr-1 inline size-6" />
          </button>
        </div>

        {showTaskSettings && (
          <section className="rounded-2xl bg-gray-100">
            <ul>
              <li>
                <button
                  type="button"
                  onClick={handleCloneTask}
                  className="flex w-full rounded-2xl p-3 font-semibold hover:bg-gray-200"
                >
                  Clone Task
                  <span className="ml-auto">
                    {!loadingAction && (
                      <ChevronRightIcon
                        className="mb-1 mr-1 inline size-6"
                        color={HexColors.get(selectedList?.color)}
                      />
                    )}
                    {loadingAction && (
                      <ArrowPathIcon
                        className="mr-3 size-7 animate-spin"
                        color={HexColors.get(selectedList?.color)}
                      />
                    )}
                  </span>
                </button>
              </li>
            </ul>
          </section>
        )}
      </div>
    </SlideOver>
  );
};
