import { useState } from 'react';

import { DeleteList } from '@/src/app/(main)/components/ListDetailSlideOver/DeleteList';
import { useLists } from '@/src/app/provider';
import { ColorPicker } from '@/src/components/ColorPicker/ColorPicker';
import { EmojiPickerComponent } from '@/src/components/EmojiPicker/EmojiPicker';
import { SlideOver } from '@/src/components/SlideOver/SlideOver';
import { useSlideOver } from '@/src/providers/slideover.provider';
import type { InputChangeEventHandler } from '@/types/events';
import type { List } from '@/types/main';

export const ListDetailSlideOver = () => {
  const {
    modalData: list,
    isOpen,
    handleCloseSlideOver,
  } = useSlideOver<List>();
  return (
    <SlideOver title="Edit list" open={isOpen} onClose={handleCloseSlideOver}>
      {list && <ListDetailForm key={list._id} list={list} />}
    </SlideOver>
  );
};

const ListDetailForm = ({ list }: { list: List }) => {
  const { handleUpdateList } = useLists();
  const [emoji, setEmoji] = useState(list?.emoji);
  const [color, setColor] = useState(list?.color);
  const [listTitle, setListTitle] = useState(list?.title ?? '');

  const handleInputChange = (e: InputChangeEventHandler) => {
    const { value } = e.target;
    setListTitle(value);
    if (list?._id)
      void handleUpdateList(list._id, { title: value }).catch(() => {});
  };

  const updateList = async (listData: Partial<List>) => {
    await handleUpdateList(list?._id, listData);
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="drawer-section">
        <label htmlFor="title-input" className="mb-2 block text-sm font-medium">
          List name
        </label>
        <input
          id="title-input"
          aria-label="List name"
          maxLength={30}
          value={listTitle ?? ''}
          className="drawer-input"
          onChange={handleInputChange}
        />
      </section>
      <section className="drawer-section">
        <ColorPicker
          color={color}
          setColor={async (newColor) => {
            setColor(newColor);
            await updateList({ color: newColor });
          }}
        />
      </section>
      <EmojiPickerComponent
        emoji={emoji || ''}
        setEmoji={async (e) => {
          setEmoji(e);
          await updateList({ emoji: e });
        }}
      />

      <DeleteList listTitle={listTitle || ''} id={list?._id} />
    </div>
  );
};
