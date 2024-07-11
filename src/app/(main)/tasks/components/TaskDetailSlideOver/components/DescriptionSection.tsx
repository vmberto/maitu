import React, { type ChangeEvent, useEffect, useRef, useState } from 'react';

import type { Task } from '@/types/main';

type DescriptionSectionProps = {
  updateTaskData: (task: Task) => () => Promise<void>;
  taskData: Task;
};

export const DescriptionSection = ({
  taskData,
  updateTaskData,
}: DescriptionSectionProps) => {
  const textareaRef = useRef({} as HTMLTextAreaElement);
  const [description, setDescription] = useState(taskData?.description || '');

  useEffect(() => {
    textareaRef.current.style.height = '0px';
    let { scrollHeight } = textareaRef.current;
    if (scrollHeight < 32) {
      scrollHeight = 32;
    }
    textareaRef.current.style.height = `${scrollHeight}px`;
  }, [textareaRef.current.value]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  return (
    <div className="h-fit rounded-2xl bg-gray-100 p-4">
      <textarea
        id="description"
        ref={textareaRef}
        value={description}
        placeholder="Write about it..."
        className="relative z-10 block w-full resize-none overflow-hidden
           rounded-md bg-transparent p-1 pb-2 text-base outline-0 focus:outline-none"
        onChange={handleChange}
        onBlur={updateTaskData({
          ...taskData,
          description,
        })}
      />
    </div>
  );
};
