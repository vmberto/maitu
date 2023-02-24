import { GenericEvent } from '@/types/events';
import { FC, useContext, useState } from 'react';
import { TodoListsContext } from '@/state/todo-lists/TodoListsProvider';
import { TodoList } from '@/types/main';
import { Input } from '@/components/Input';

interface ColorPickerProps {}
export const ColorPicker: FC<ColorPickerProps> = ({}) => {
  return (
    <div className="flex">
      <div
        className="
        transition-all border-danger border
         bg-white p-4 rounded-full font-semibold items-center"></div>
    </div>
  );
};
