'use client';

import { useEffect } from 'react';

import { NewTextInput } from '@/src/app/(main)/timeline/components/NewTextInput';
import { Texts } from '@/src/app/(main)/timeline/components/Texts';
import { useTasks } from '@/src/app/(main)/timeline/state/provider';
import type { List, Task } from '@/types/main';

export type TimelineWrapperProps = {
  list: List;
  tasks: Task[];
};

export const TimelineWrapper = ({ list, tasks }: TimelineWrapperProps) => {
  const { handleSetInitialState } = useTasks();

  useEffect(() => {
    handleSetInitialState(list, tasks);
  }, []);

  return (
    <section className="mx-auto h-full max-w-xl">
      <div className="px-5 pb-5">
        <NewTextInput />
        <Texts />
      </div>
    </section>
  );
};
