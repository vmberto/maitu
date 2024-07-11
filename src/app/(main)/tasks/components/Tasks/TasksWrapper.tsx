'use client';

import React, { useEffect } from 'react';

import { CompleteTasks } from '@/src/app/(main)/tasks/components/Tasks/CompleteTasks';
import { Tasks } from '@/src/app/(main)/tasks/components/Tasks/Tasks';
import { useTasks } from '@/src/app/(main)/tasks/state/provider';
import type { List, Task } from '@/types/main';

export type TasksWrapperProps = {
  list: List;
  tasks: Task[];
};

export const TasksWrapper = ({ list, tasks }: TasksWrapperProps) => {
  const { handleSetInitialState } = useTasks();

  useEffect(() => {
    handleSetInitialState(list, tasks);
  }, []);

  return (
    <section className="mx-auto h-full max-w-xl">
      <Tasks />
      <CompleteTasks />
    </section>
  );
};
