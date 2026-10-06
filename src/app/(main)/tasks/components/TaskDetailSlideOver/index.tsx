'use client';

import {
  ArrowPathIcon,
  MapPinIcon,
  Square2StackIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import React, { useState } from 'react';

import { DescriptionSection } from '@/src/app/(main)/tasks/components/TaskDetailSlideOver/components/DescriptionSection';
import { TaskDetailTitle } from '@/src/app/(main)/tasks/components/TaskDetailSlideOver/components/TaskDetailTitle';
import { SubTasksWrapper } from '@/src/app/(main)/tasks/components/TaskDetailSlideOver/Subtasks/SubTasksWrapper';
import { LocationAddon } from './LocationAddon';
import { TagsWrapper } from '@/src/app/(main)/tasks/components/TaskDetailSlideOver/Tags/TagsWrapper';
import { useTasks } from '@/src/app/(main)/tasks/state/provider';
import { useOffline } from '@/src/components/Offline/OfflineProvider';
import { SlideOver } from '@/src/components/SlideOver/SlideOver';
import { useSlideOver } from '@/src/providers/slideover.provider';
import type { Task } from '@/types/main';

export const TaskDetailSlideOver = () => {
  const {
    handleUpdateTask,
    handleCloneTask,
    handleCompleteTask,
    selectedList,
    loadingAction,
  } = useTasks();
  const [movingToUndone, setMovingToUndone] = useState(false);
  const [showTaskSettings, setShowTaskSettings] = useState(false);
  const {
    modalData: selectedTask,
    isOpen,
    handleCloseSlideOver,
  } = useSlideOver<Task>();

  const { account } = useOffline();
  const taskData = account?.tasks.find(
    (task) => task._id === selectedTask?._id,
  ) as Task | undefined;

  const hasLocation =
    !!taskData &&
    (!!taskData.location || taskData.addons?.includes('location'));
  const [optionsError, setOptionsError] = useState('');

  async function addLocation() {
    if (!taskData) return;
    setOptionsError('');
    try {
      await handleUpdateTask({ _id: taskData._id, addons: ['location'] })();
    } catch {
      setOptionsError(
        'Could not add Location on this device. Please try again.',
      );
    }
  }

  async function moveToUndone() {
    if (!taskData || movingToUndone) return;
    setMovingToUndone(true);
    setOptionsError('');
    try {
      await handleCompleteTask(taskData);
    } catch {
      setOptionsError('Could not move this task to undone. Please try again.');
    } finally {
      setMovingToUndone(false);
    }
  }

  return (
    <SlideOver
      title={
        <TaskDetailTitle taskData={taskData} listColor={selectedList?.color} />
      }
      open={isOpen}
      onClose={handleCloseSlideOver}
    >
      <div className="task-drawer flex h-full flex-col gap-3">
        {taskData && (
          <DescriptionSection
            key={`description:${taskData._id}`}
            taskData={taskData}
            updateTaskData={handleUpdateTask}
          />
        )}
        <SubTasksWrapper />
        {taskData && (
          <TagsWrapper
            key={`tags:${taskData._id}`}
            listColor={selectedList?.color}
            taskData={taskData}
          />
        )}
        {taskData && hasLocation && (
          <LocationAddon key={`location:${taskData._id}`} task={taskData} />
        )}
        <div className="mt-auto text-center">
          <button
            type="button"
            className="rubber-button text-sm text-gray-600 hover:text-gray-900"
            aria-expanded={showTaskSettings}
            aria-controls="task-options"
            onClick={() => setShowTaskSettings(!showTaskSettings)}
          >
            Task options{' '}
            <ChevronDownIcon
              className={`mb-1 mr-1 inline size-6 transition-transform duration-200 motion-reduce:transition-none ${showTaskSettings ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        <div
          className="drawer-expandable"
          data-open={showTaskSettings}
          aria-hidden={!showTaskSettings}
          inert={!showTaskSettings}
        >
          <div className="overflow-hidden">
            <section
              id="task-options"
              className="drawer-section"
              aria-label="Task options"
            >
              <h2 className="mb-2 text-xs font-medium text-gray-500">
                Actions
              </h2>
              {taskData?.complete && (
                <button
                  type="button"
                  disabled={movingToUndone}
                  onClick={() => void moveToUndone()}
                  className="rubber-button rubber-row mb-2 flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-medium text-gray-900"
                >
                  <ArrowUturnLeftIcon className="size-5 shrink-0 text-gray-500" />
                  <span>Move to undone</span>
                  <ChevronRightIcon className="ml-auto size-5 text-gray-500" />
                </button>
              )}
              <button
                type="button"
                disabled={loadingAction}
                aria-busy={loadingAction || undefined}
                onClick={handleCloneTask}
                className="rubber-button rubber-row flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-medium text-gray-900"
              >
                <Square2StackIcon className="size-5 shrink-0 text-gray-500" />
                <span>Clone Task</span>
                {loadingAction ? (
                  <ArrowPathIcon className="ml-auto size-5 animate-spin motion-reduce:animate-none" />
                ) : (
                  <ChevronRightIcon className="ml-auto size-5 text-gray-500" />
                )}
              </button>
              <h2 className="mb-2 mt-5 text-xs font-medium text-gray-500">
                Add-ons
              </h2>
              <button
                type="button"
                disabled={hasLocation}
                onClick={() => void addLocation()}
                className="rubber-button rubber-row flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-medium text-gray-900"
              >
                <MapPinIcon className="size-5 shrink-0 text-gray-500" />
                <span>{hasLocation ? 'Location added' : 'Add location'}</span>
                <ChevronRightIcon className="ml-auto size-5 text-gray-500" />
              </button>
              {optionsError && (
                <p role="alert" className="mt-2 text-sm text-danger">
                  {optionsError}
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </SlideOver>
  );
};
