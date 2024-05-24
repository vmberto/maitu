import React, { type ChangeEvent, useEffect, useRef, useState } from 'react';

import type { GenericEvent } from '@/types/events';
import type { Todo } from '@/types/main';

type DescriptionSectionProps = {
  updateTodoData: (todo: Todo) => (e: GenericEvent) => Promise<void>;
  todoData: Todo;
};

export const DescriptionSection = ({
  todoData,
  updateTodoData,
}: DescriptionSectionProps) => {
  const textareaRef = useRef({} as HTMLTextAreaElement);
  const [description, setDescription] = useState(todoData?.description || '');

  useEffect(() => {
    textareaRef.current.style.height = '0px';
    let { scrollHeight } = textareaRef.current;
    if (scrollHeight < 96) {
      scrollHeight = 96;
    }
    textareaRef.current.style.height = `${scrollHeight}px`;
  }, [textareaRef.current.value]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  return (
    <div className="mb-3">
      <textarea
        id="description"
        ref={textareaRef}
        value={description}
        placeholder="Write about it..."
        className="relative z-10 mb-4 block w-full resize-none overflow-hidden
           rounded-md bg-transparent px-2 pb-2 pt-1 text-base outline-0 focus:outline-none"
        onChange={handleChange}
        onBlur={updateTodoData({
          ...todoData,
          description,
        })}
      />
    </div>
  );
};
