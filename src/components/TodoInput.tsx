import React, { DetailedHTMLProps, useEffect, useRef, FC, TextareaHTMLAttributes } from 'react';
import { GenericEvent } from '@/types/events';
import { Todo } from '@/types/main';

type ElProps<T, R> = DetailedHTMLProps<T, R>;

export interface TodoInputProps
  extends ElProps<TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement> {
  todoData?: Todo;
  handleCompleteTodo?: (t: Todo) => void;
}

const TodoInput: FC<TodoInputProps> = ({ todoData, handleCompleteTodo, ...rest }) => {
  const textareaRef = useRef({} as HTMLTextAreaElement);

  useEffect(() => {
    textareaRef.current.style.height = '0px';
    const scrollHeight = textareaRef.current.scrollHeight;
    textareaRef.current.style.height = scrollHeight + 'px';
  }, [rest.value]);

  const handleClickCompleteTodo = (e: GenericEvent) => {
    e.stopPropagation();
    if (todoData && handleCompleteTodo) {
      handleCompleteTodo(todoData);
    }
  };

  return (
    <div className="flex items-center border-t-2">
      <button
        onClick={handleClickCompleteTodo}
        className="cursor-pointer relative
        transition-all border-primary border mr-3
          p-3.5 rounded-full font-semibold items-center">
        {todoData?.complete && (
          <div className="absolute bg-primary h-5 w-5 rounded-full right-1 top-1"></div>
        )}
      </button>
      <textarea
        ref={textareaRef}
        className="block
                    w-full
                    relative z-10
                    bg-transparent
                    overflow-hidden
                    resize-none
                    text-lg
                    px-2 py-4
                    outline-0
                    focus:outline-none"
        {...rest}></textarea>
    </div>
  );
};

export default TodoInput;
