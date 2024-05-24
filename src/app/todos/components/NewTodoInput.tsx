'use client';

import type { KeyboardEventHandler } from 'react';
import React, { useEffect, useRef } from 'react';

import { useTodos } from '@/src/app/todos/state/provider';
import { stopPropagationFn } from '@/src/lib/functions';
import { type Todo } from '@/types/main';

export const NewTodoInput = () => {
  const textareaRef = useRef({} as HTMLTextAreaElement);

  const { newTodo, handleAddTodo, handleChangeNewTodo, handleInputFocus } =
    useTodos();

  useEffect(() => {
    textareaRef.current.style.height = '0px';
    const { scrollHeight } = textareaRef.current;
    textareaRef.current.style.height = `${scrollHeight}px`;
  }, [newTodo.title]);

  const handleKeyPressAdd: KeyboardEventHandler<HTMLTextAreaElement> = async (
    e,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleAddTodo();
    }
  };

  return (
    <div className="flex items-center border-b-2 border-gray-100 py-3">
      <button
        type="button"
        aria-label="complete-todo-disabled"
        className="relative mr-2 cursor-pointer
        items-center self-start rounded-full border-2
          border-primary p-3.5 font-semibold transition-all"
      />

      <textarea
        id="new-todo"
        ref={textareaRef}
        className="relative z-10 block w-full resize-none overflow-hidden
                    bg-transparent px-2 text-base outline-0 focus:outline-none"
        value={newTodo.title}
        onClick={stopPropagationFn}
        onBlur={handleAddTodo}
        onKeyDown={handleKeyPressAdd}
        onChange={handleChangeNewTodo}
        onFocus={handleInputFocus(newTodo as Todo)}
      />
    </div>
  );
};
