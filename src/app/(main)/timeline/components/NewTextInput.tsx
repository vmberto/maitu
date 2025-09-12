'use client';

import { useEffect, useRef } from 'react';

import { useTimeline } from '@/src/app/(main)/timeline/state/provider';
import { Button } from '@/src/components/Button/Button';
import { stopPropagationFn } from '@/src/lib/functions';
import type { Task } from '@/types/main';

export const NewTextInput = () => {
  const textareaRef = useRef({} as HTMLTextAreaElement);

  const { newTask, handleAddTask, handleChangeNewTask, handleInputFocus } =
    useTimeline();

  useEffect(() => {
    textareaRef.current.style.height = '0px';
    const { scrollHeight } = textareaRef.current;
    textareaRef.current.style.height = `${scrollHeight}px`;
  }, [newTask.title]);

  return (
    <div className="flex items-center border-b-2 border-gray-100 p-2">
      <textarea
        id="new-task"
        ref={textareaRef}
        placeholder="sup"
        className="relative z-10 block w-full resize-none overflow-hidden
                    bg-transparent px-2 text-base outline-0 focus:outline-none"
        value={newTask.title}
        onClick={stopPropagationFn}
        onChange={handleChangeNewTask}
        onFocus={handleInputFocus(newTask as Task)}
      />
      <Button className="self-end" type="button" onClick={handleAddTask}>
        Add
      </Button>
    </div>
  );
};
