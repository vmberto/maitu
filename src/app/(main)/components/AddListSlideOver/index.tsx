import { useState } from 'react';

import { Button } from '@/src/components/Button/Button';
import { ColorPicker, Colors } from '@/src/components/ColorPicker/ColorPicker';
import { EmojiPickerComponent } from '@/src/components/EmojiPicker/EmojiPicker';
import { Input } from '@/src/components/Input/Input';
import { Select } from '@/src/components/Select';
import { SlideOver } from '@/src/components/SlideOver/SlideOver';
import type { GenericEvent, InputChangeEventHandler } from '@/types/events';
import { type List, ListType } from '@/types/main';

type AddListSlideOverProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleAddList: (newList: List) => void;
};

const listTypeOptions = [
  {
    id: 1,
    name: 'Tasks',
    value: ListType.tasks,
  },
  {
    id: 2,
    name: 'Timeline',
    value: ListType.timeline,
  },
];

export const AddListSlideOver = ({
  setOpen,
  handleAddList,
  open,
}: AddListSlideOverProps) => {
  const [listTitle, setListTitle] = useState('');
  const [color, setColor] = useState<Colors>(Colors.PRIMARY);
  const [emoji, setEmoji] = useState('');
  const [listType, setListType] = useState(listTypeOptions[0]);

  const resetSlideOverData = () => {
    setOpen(false);
    setListTitle('');
    setEmoji('');
    setColor(Colors.PRIMARY);
  };

  const handleInputChange = (e: InputChangeEventHandler) => {
    const { value } = e.target;
    setListTitle(value);
  };

  const handleSubmit = async (e: GenericEvent) => {
    e.preventDefault();
    if (listTitle.length && emoji) {
      const newList = {
        title: listTitle,
        emoji,
        color,
        createdAt: new Date().toISOString(),
        type: listType.value,
      } as List;
      handleAddList(newList);
      resetSlideOverData();
    }
  };

  return (
    <SlideOver title="New List" open={open} onClose={resetSlideOverData}>
      <form
        id="addData-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <Input
          value={listTitle}
          maxLength={30}
          onChange={handleInputChange}
          label="List Name"
        />

        <Select
          label="Select List Type"
          options={listTypeOptions}
          selectedValue={listType}
          setSelectedValue={setListType}
        />

        <ColorPicker color={color} setColor={setColor} />

        <EmojiPickerComponent emoji={emoji} setEmoji={setEmoji} />

        <Button type="submit" label="Submit" className="mt-8" color="primary" />
      </form>
    </SlideOver>
  );
};
