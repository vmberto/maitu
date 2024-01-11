import React, { type ChangeEvent, useRef, useState } from 'react';

import type { GenericEvent } from '../../../../../../types/events';
import { type Todo } from '../../../../../../types/main';

interface DescriptionSectionProps {
  updateTodoData: (todo: Todo) => (e: GenericEvent) => Promise<void>;
  todoData: Todo;
}

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
          onBlur={updateTodoData({
            ...todoData,
            description,
          })}
        />
      </label>
    </div>
  );
};
