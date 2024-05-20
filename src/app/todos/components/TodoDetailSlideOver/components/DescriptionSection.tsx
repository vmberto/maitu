import React, { type ChangeEvent, useRef, useState } from 'react';

import type { Todo } from '@/types/main';

type DescriptionSectionProps = {
  updateTodoData: (todo: Todo) => Promise<void>;
  todoData: Todo;
};

export const DescriptionSection = ({
  todoData,
  updateTodoData,
}: DescriptionSectionProps) => {
  const textareaRef = useRef({} as HTMLTextAreaElement);
  const [description, setDescription] = useState(todoData?.description || '');

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
        className="relative z-10 mb-4 block h-1/2 w-full resize-none overflow-scroll
           rounded-md bg-transparent px-2 pb-2 pt-1 text-base outline-0 focus:outline-none"
        onChange={handleChange}
        onBlur={async () =>
          updateTodoData({
            ...todoData,
            description,
          })
        }
      />
    </div>
  );
};
