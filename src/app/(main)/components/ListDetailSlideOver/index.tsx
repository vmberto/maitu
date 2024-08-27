import { useEffect, useState } from 'react';

import { DeleteList } from '@/src/app/(main)/components/ListDetailSlideOver/DeleteList';
import { useLists } from '@/src/app/provider';
import { EmojiPickerComponent } from '@/src/components/EmojiPicker/EmojiPicker';
import { SlideOver } from '@/src/components/SlideOver/SlideOver';
import { useSlideOver } from '@/src/providers/slideover.provider';
import type { InputChangeEventHandler } from '@/types/events';
import type { List } from '@/types/main';

export const ListDetailSlideOver = () => {
  const { handleUpdateList } = useLists();
  const {
    modalData: list,
    isOpen,
    handleCloseSlideOver,
  } = useSlideOver<List>();

  const [emoji, setEmoji] = useState(list?.emoji);
  const [listTitle, setListTitle] = useState(list?.title);

  useEffect(() => {
    setListTitle(list?.title);
    setEmoji(list?.emoji);
  }, [list]);

  const handleInputChange = (e: InputChangeEventHandler) => {
    const { value } = e.target;
    setListTitle(value);
  };

  const updateList = async (listData: Partial<List>) => {
    await handleUpdateList(list?._id, listData);
  };

  return (
    <SlideOver
      title={
        <input
          id="title-input"
          maxLength={30}
          value={listTitle}
          className="w-full leading-7 focus:outline-0"
          onChange={handleInputChange}
          onBlur={() => updateList({ title: listTitle })}
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              await updateList({ title: listTitle });
            }
          }}
        />
      }
      open={isOpen}
      onClose={handleCloseSlideOver}
    >
      <EmojiPickerComponent
        emoji={emoji || ''}
        setEmoji={async (e) => {
          setEmoji(e);
          await updateList({ emoji: e });
        }}
      />

      <DeleteList listTitle={list?.title || ''} id={list?._id} />
    </SlideOver>
  );
};
