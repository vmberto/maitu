import React, { useState } from 'react';

import type { GenericEvent, InputChangeEventHandler } from '@/types/events';
import type { Task } from '@/types/main';

type InputSectionProps = {
  label: string;
  propertyName: keyof Task;
  updateTaskData: (task: Task) => (e: GenericEvent) => Promise<void>;
  taskData: Task;
};

export const InputSection = ({
  taskData,
  updateTaskData,
  label,
  propertyName,
}: InputSectionProps) => {
  const [value, setValue] = useState(taskData[propertyName] as string);

  return (
    <div className="mb-3">
      <label
        htmlFor="input"
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        {label}
      </label>
      <input
        id="input"
        placeholder="Latitude, Longitude"
        className="relative mb-2 block h-auto w-full resize-none overflow-auto
        rounded-md border-2 bg-transparent p-3 text-base outline-0 focus:outline-none"
        onBlur={updateTaskData({
          ...taskData,
          [propertyName]: value,
        })}
        onChange={(e: InputChangeEventHandler) => {
          setValue(e.target.value);
        }}
        value={value}
      />
    </div>
  );
};
