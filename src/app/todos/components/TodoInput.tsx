'use client';

import { Menu } from '@headlessui/react';
import { EllipsisHorizontalCircleIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef } from 'react';

import { useTodos } from '@/src/app/todos/state/provider';
import { stopPropagationFn } from '@/src/lib/functions';
import { useModals } from '@/src/providers/slideover.provider';
import { type GenericEvent } from '@/types/events';
import { type Todo } from '@/types/main';

export type TodoInputComponentProps = {
  todoData: Todo;
  disabled?: boolean;
};

export const TodoInput = ({ todoData, disabled }: TodoInputComponentProps) => {
  const textareaRef = useRef({} as HTMLTextAreaElement);
  const { handleOpenSlideOver } = useModals();

  const {
    handleRemoveOrUpdateTitle,
    handleInputFocus,
    handleCompleteTodo,
    handleChangeExistingTodo,
  } = useTodos();

  useEffect(() => {
    textareaRef.current.style.height = '0px';
    const { scrollHeight } = textareaRef.current;
    textareaRef.current.style.height = `${scrollHeight}px`;
  }, [todoData.title]);

  const handleClickCompleteTodo = async (e: GenericEvent) => {
    e.stopPropagation();
    if (todoData && !todoData.complete && handleCompleteTodo) {
      await handleCompleteTodo(todoData);
    }
  };

  return (
    <div className="flex items-center border-b-2 border-gray-100 py-3">
      <button
        type="button"
        onClick={handleClickCompleteTodo}
        className="relative mr-2 cursor-pointer
        items-center self-start rounded-full border-2
          border-primary p-3.5 font-semibold transition-all"
      >
        {todoData?.complete && (
          <div className="absolute right-1 top-1 size-5 rounded-full bg-primary" />
        )}
      </button>

      <textarea
        ref={textareaRef}
        className="relative z-10 block w-full resize-none overflow-hidden
                    bg-transparent px-2 text-base outline-0 focus:outline-none"
        value={todoData.title}
        onClick={stopPropagationFn}
        onFocus={handleInputFocus(todoData)}
        onBlur={handleRemoveOrUpdateTitle}
        onChange={handleChangeExistingTodo}
        disabled={disabled}
      />

      {todoData?._id && (
        <Menu as="div" className="relative inline-block self-start text-left">
          <Menu.Button
            onClick={handleOpenSlideOver(todoData)}
            className="inline-flex w-full justify-center
                rounded-full p-1 text-sm font-medium text-gray-700
                focus:ring-offset-2 focus:ring-offset-gray-200 betterhover:hover:bg-gray-200"
          >
            <EllipsisHorizontalCircleIcon className="size-6" />
          </Menu.Button>
        </Menu>
      )}
    </div>
  );
};
