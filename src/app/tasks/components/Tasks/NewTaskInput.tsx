'use client';

import type { KeyboardEventHandler } from 'react';
import React, { useEffect, useRef } from 'react';

import { useTasks } from '@/src/app/tasks/state/provider';
import { stopPropagationFn } from '@/src/lib/functions';
import { type Task } from '@/types/main';

export const NewTaskInput = () => {
  const textareaRef = useRef({} as HTMLTextAreaElement);

  const { newTask, handleAddTask, handleChangeNewTask, handleInputFocus } =
    useTasks();

  useEffect(() => {
    textareaRef.current.style.height = '0px';
    const { scrollHeight } = textareaRef.current;
    textareaRef.current.style.height = `${scrollHeight}px`;
  }, [newTask.title]);

  const handleKeyPressAdd: KeyboardEventHandler<HTMLTextAreaElement> = async (
    e,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleAddTask();
    }
  };

  return (
    <div className="flex items-center border-b-2 border-gray-100 py-3">
      <button
        type="button"
        aria-label="complete-task-disabled"
        className="relative mr-2 cursor-pointer
        items-center self-start rounded-full border-2
          border-primary p-3.5 font-semibold transition-all"
      />

      <textarea
        id="new-task"
        ref={textareaRef}
        className="relative z-10 block w-full resize-none overflow-hidden
                    bg-transparent px-2 text-base outline-0 focus:outline-none"
        value={newTask.title}
        onClick={stopPropagationFn}
        onBlur={handleAddTask}
        onKeyDown={handleKeyPressAdd}
        onChange={handleChangeNewTask}
        onFocus={handleInputFocus(newTask as Task)}
      />
    </div>
  );
};
