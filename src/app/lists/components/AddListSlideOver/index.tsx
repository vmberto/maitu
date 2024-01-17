import { useState } from 'react';

import { Button } from '@/src/components/Button';
import { ColorPicker, Colors } from '@/src/components/ColorPicker';
import { Input } from '@/src/components/Input';
import SlideOver from '@/src/components/SlideOver';
import type { GenericEvent, InputChangeEventHandler } from '@/types/events';
import { type TodoList } from '@/types/main';

type AddListSlideOverProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleAddTodoList: (newTodoList: TodoList) => void;
};

export const AddListSlideOver = ({
  setOpen,
  handleAddTodoList,
  open,
}: AddListSlideOverProps) => {
  const [listTitle, setListTitle] = useState('');
  const [color, setColor] = useState(Colors.PRIMARY);

  const handleInputChange = (e: InputChangeEventHandler) => {
    const { value } = e.target;
    setListTitle(value);
  };

  const handleSubmit = async (e: GenericEvent) => {
    e.preventDefault();
    if (listTitle.length) {
      const newList = {
        title: listTitle,
        color,
        createdAt: new Date(),
      } as TodoList;
      handleAddTodoList(newList);
      setOpen(false);
    }
  };

  return (
    <SlideOver title="Add List" open={open} onClose={() => setOpen(false)}>
      <form id="addData-form" onSubmit={handleSubmit}>
        <Input
          value={listTitle}
          maxLength={30}
          onChange={handleInputChange}
          label="List Name"
        />
        <ColorPicker color={color} setColor={setColor} />
        <Button type="submit" className="mt-8" color={color} />
      </form>
    </SlideOver>
  );
};
