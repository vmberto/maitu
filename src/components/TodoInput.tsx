import React, { DetailedHTMLProps, useEffect, useRef, FC, TextareaHTMLAttributes } from 'react';

type ElProps<T, R> = DetailedHTMLProps<T, R>;

export interface TextareaProps
  extends ElProps<TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement> {}

const TodoInput: FC<TextareaProps> = (props) => {
  const textareaRef = useRef({} as HTMLTextAreaElement);

  useEffect(() => {
    textareaRef.current.style.height = '0px';
    const scrollHeight = textareaRef.current.scrollHeight;
    textareaRef.current.style.height = scrollHeight + 'px';
  }, [props.value]);

  return (
    <div className="border-t-2">
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
        {...props}></textarea>
    </div>
  );
};

export default TodoInput;
