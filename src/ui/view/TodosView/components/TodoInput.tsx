/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import { Menu } from '@headlessui/react';
import { EllipsisHorizontalCircleIcon } from '@heroicons/react/24/outline';
import React, {
  type DetailedHTMLProps,
  type ForwardedRef,
  forwardRef,
  type TextareaHTMLAttributes,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { TodoDetailSlideOver } from 'src/ui/view/TodosView/components/TodoDetailSlideOver';

import { type GenericEvent } from '../../../../../types/events';
import { type Todo } from '../../../../../types/main';

type ElProps<T, R> = DetailedHTMLProps<T, R>;

export interface TodoInputComponentProps
  extends ElProps<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  > {
  todoData?: Todo;
  handleCompleteTodo?: (t: Todo) => void;
}

const TodoInputComponent = (
  { todoData, handleCompleteTodo, ...rest }: TodoInputComponentProps,
  ref: ForwardedRef<HTMLTextAreaElement>,
) => {
  const textareaRef = useRef({} as HTMLTextAreaElement);
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => textareaRef.current);

  useEffect(() => {
    textareaRef.current.style.height = '0px';
    const { scrollHeight } = textareaRef.current;
    textareaRef.current.style.height = `${scrollHeight}px`;
  }, [rest.value]);

  const handleClickCompleteTodo = (e: GenericEvent) => {
    e.stopPropagation();
    if (todoData && handleCompleteTodo) {
      handleCompleteTodo(todoData);
    }
  };

  const handleClick = (e: GenericEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <div className="flex items-center border-t-2">
      <div
        onClick={handleClickCompleteTodo}
        className="relative mr-2
        cursor-pointer items-center rounded-full border-2
          border-primary p-3.5 font-semibold transition-all"
      >
        {todoData?.complete && (
          <div className="absolute right-1 top-1 h-5 w-5 rounded-full bg-primary" />
        )}
      </div>
      <textarea
        ref={textareaRef}
        className="relative
                    z-10
                    block w-full
                    resize-none
                    overflow-hidden
                    bg-transparent
                    px-2
                    py-4 text-base
                    outline-0
                    focus:outline-none"
        {...rest}
      />
      {todoData?.id && (
        <>
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button
              onClick={handleClick}
              className="inline-flex w-full justify-center
                rounded-full p-1 text-sm font-medium text-gray-700
                focus:ring-offset-2 focus:ring-offset-gray-200 betterhover:hover:bg-gray-200"
            >
              <EllipsisHorizontalCircleIcon className="h-6 w-6" />
            </Menu.Button>
          </Menu>
          <TodoDetailSlideOver
            todoData={todoData}
            open={open}
            setOpen={setOpen}
          />
        </>
      )}
    </div>
  );
};

export const TodoInput = forwardRef(TodoInputComponent);
