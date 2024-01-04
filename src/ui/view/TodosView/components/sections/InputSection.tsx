import React, { useState } from 'react';
import { type useTodos } from 'src/hooks/useTodos';

import { type GenericEvent } from '../../../../../../types/events';
import { type Todo } from '../../../../../../types/main';

interface InputSectionProps {
  label: string;
  propertyName: keyof Todo;
  todoService: ReturnType<typeof useTodos>;
  todoData: Todo;
}

export const InputSection = ({
  todoData,
  todoService,
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
        className="relative mb-2 block h-auto w-full resize-none overflow-auto rounded-md
                            border-2
                            bg-transparent
                            p-3
                            text-base
                            outline-0
                            focus:outline-none"
        onBlur={todoService.updateTodoData({
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
