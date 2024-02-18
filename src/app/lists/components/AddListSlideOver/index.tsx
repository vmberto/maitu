import { useState } from 'react';

import { Button } from '@/src/components/Button';
import { EmojiPickerComponent } from '@/src/components/EmojiPicker';
import { Input } from '@/src/components/Input';
import SlideOver from '@/src/components/SlideOver';
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

        <EmojiPickerComponent emoji={emoji} setEmoji={setEmoji} />

        <Button type="submit" label="Submit" className="mt-8" color="primary" />
      </form>
    </SlideOver>
  );
};
