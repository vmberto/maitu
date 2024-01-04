import React, { type ChangeEvent, useRef, useState } from 'react';
import { type useTodos } from 'src/hooks/useTodos';

import { type Todo } from '../../../../../../types/main';

interface DescriptionSectionProps {
  todoService: ReturnType<typeof useTodos>;
  todoData: Todo;
}

export const DescriptionSection = ({
  todoData,
  todoService,
}: DescriptionSectionProps) => {
  const textareaRef = useRef({} as HTMLTextAreaElement);
  const [description, setDescription] = useState(todoData?.description || '');

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  return (
    <div className="mb-3">
      <label
        htmlFor="description"
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        Description
        <textarea
          id="description"
          ref={textareaRef}
          value={description}
          placeholder="Set a description"
          className="relative block h-auto w-full resize-none overflow-auto rounded-md
        border-2 bg-transparent px-3 pb-3 pt-2 text-base outline-0 focus:outline-none"
          onChange={handleChange}
          onBlur={todoService.updateTodoData({
            ...todoData,
            description,
          })}
        />
      </label>
    </div>
  );
};
