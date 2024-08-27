import { useState } from 'react';

import { Button } from '@/src/components/Button/Button';
import { EmojiPickerComponent } from '@/src/components/EmojiPicker/EmojiPicker';
import { Input } from '@/src/components/Input/Input';
import { SlideOver } from '@/src/components/SlideOver/SlideOver';
import type { GenericEvent, InputChangeEventHandler } from '@/types/events';
import { type List } from '@/types/main';

type AddListSlideOverProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleAddList: (newList: List) => void;
};

export const AddListSlideOver = ({
  setOpen,
  handleAddList,
  open,
}: AddListSlideOverProps) => {
  const [listTitle, setListTitle] = useState('');
  const [emoji, setEmoji] = useState('');

  const resetSlideOverData = () => {
    setOpen(false);
    setListTitle('');
    setEmoji('');
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
        createdAt: new Date().toISOString(),
      } as List;
      handleAddList(newList);
      resetSlideOverData();
    }
  };

  return (
    <SlideOver title="Add List" open={open} onClose={resetSlideOverData}>
      <form
        id="addData-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-3"
      >
        <Input
          value={listTitle}
          maxLength={30}
          onChange={handleInputChange}
          label="List Name"
        />

        <EmojiPickerComponent emoji={emoji} setEmoji={setEmoji} />

        <Button type="submit" label="Submit" className="mt-8" color="primary" />
      </form>
    </SlideOver>
  );
};
