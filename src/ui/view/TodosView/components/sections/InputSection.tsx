import React, { useState } from 'react';

import { type GenericEvent } from '../../../../../../types/events';
import { type Todo } from '../../../../../../types/main';

interface InputSectionProps {
  label: string;
  propertyName: keyof Todo;
  updateTodoData: (todo: Todo) => (e: GenericEvent) => Promise<void>;
  todoData: Todo;
}

export const InputSection = ({
  todoData,
  updateTodoData,
  label,
  propertyName,
}: InputSectionProps) => {
  const [value, setValue] = useState(todoData[propertyName] as string);

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
        onBlur={updateTodoData({
          ...todoData,
          [propertyName]: value,
        })}
        onChange={(e: GenericEvent) => {
          setValue(e.target.value);
        }}
        value={value}
      />
    </div>
  );
};
