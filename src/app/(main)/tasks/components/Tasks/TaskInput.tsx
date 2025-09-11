'use client';

import { Menu, MenuButton } from '@headlessui/react';
import { EllipsisHorizontalCircleIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef } from 'react';

import { useTasks } from '@/src/app/(main)/tasks/state/provider';
import { BackgroundColors, BorderColors } from '@/src/lib/colors';
import { stopPropagationFn } from '@/src/lib/functions';
import { useSlideOver } from '@/src/providers/slideover.provider';
import { type GenericEvent } from '@/types/events';
import { type Task } from '@/types/main';

export type TaskInputComponentProps = {
  taskData: Task;
  disabled?: boolean;
};

export const TaskInput = ({ taskData, disabled }: TaskInputComponentProps) => {
  const textareaRef = useRef({} as HTMLTextAreaElement);
  const { handleOpenSlideOver } = useSlideOver();

  const {
    handleRemoveOrUpdateTitle,
    handleInputFocus,
    handleCompleteTask,
    handleChangeExistingTask,
    selectedList,
  } = useTasks();

  useEffect(() => {
    textareaRef.current.style.height = '0px';
    const { scrollHeight } = textareaRef.current;
    textareaRef.current.style.height = `${scrollHeight}px`;
  }, [taskData.title]);

  const handleClickCompleteTask = async (e: GenericEvent) => {
    e.stopPropagation();
    if (taskData && !taskData.completedAt && handleCompleteTask) {
      await handleCompleteTask(taskData);
    }
  };

  return (
    <div className="flex items-center border-b-2 border-gray-100 py-3">
      <button
        type="button"
        aria-label="completeTask"
        onClick={handleClickCompleteTask}
        className={`${BorderColors.get(selectedList.color)} relative mr-2
        cursor-pointer items-center self-start rounded-full
          border-2 p-3.5 font-semibold transition-all`}
      >
        {taskData?.completedAt && (
          <div
            className={`${BackgroundColors.get(selectedList.color)} absolute right-1 top-1 size-5 rounded-full`}
          />
        )}
      </button>

      <div className="relative z-10 flex h-fit w-full flex-col gap-1 overflow-hidden px-2">
        <textarea
          ref={textareaRef}
          className="w-full resize-none bg-transparent text-base outline-0 focus:outline-none"
          value={taskData.title}
          onClick={stopPropagationFn}
          onFocus={handleInputFocus(taskData)}
          onBlur={handleRemoveOrUpdateTitle}
          onChange={handleChangeExistingTask}
          disabled={disabled}
        />
        {taskData.tags && (
          <div className="flex flex-wrap gap-1">
            {taskData.tags.map((tag) => (
              <div
                key={tag}
                className={`rounded-md ${BackgroundColors.get(selectedList.color)} flex items-center 
          justify-center px-2 align-middle text-sm text-white`}
              >
                {tag}
              </div>
            ))}
          </div>
        )}
      </div>

      {taskData?._id && !taskData?.parentTaskId && (
        <Menu as="div" className="relative inline-block self-start text-left">
          <MenuButton
            aria-label="openSlideOver"
            onClick={handleOpenSlideOver(taskData)}
            className="inline-flex w-full justify-center
                rounded-full p-1 text-sm font-medium text-gray-700
                focus:ring-offset-2 focus:ring-offset-gray-200 betterhover:hover:bg-gray-200"
          >
            <EllipsisHorizontalCircleIcon className="size-6" />
          </MenuButton>
        </Menu>
      )}
    </div>
  );
};
