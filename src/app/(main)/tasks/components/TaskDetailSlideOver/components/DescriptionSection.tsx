import React, { type ChangeEvent, useEffect, useRef, useState } from 'react';

import type { Task } from '@/types/main';

type DescriptionSectionProps = {
  updateTaskData: (task: Partial<Task>) => () => Promise<void>;
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
  }, [description]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
    void updateTaskData({
      _id: taskData._id,
      description: event.target.value,
    })().catch(() => {});
  };

  return (
    <div className="drawer-section h-fit">
      <textarea
        id="description"
        aria-label="Description"
        ref={textareaRef}
        value={description}
        placeholder="Write about it..."
        className="drawer-input block min-h-[32px] resize-none overflow-hidden"
        onChange={handleChange}
      />
    </div>
  );
};
