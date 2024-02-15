import { useEffect, useState } from 'react';

import { DeleteList } from '@/src/app/lists/components/ListDetailSlideOver/DeleteList';
import { useLists } from '@/src/app/lists/provider';
import { ColorPicker } from '@/src/components/ColorPicker';
import SlideOver from '@/src/components/SlideOver';
import type { InputChangeEventHandler } from '@/types/events';
import type { List } from '@/types/main';

export const ListDetailSlideOver = () => {
  const {
    currentList: list,
    isListDetailOpen,
    handleCloseSlideOver,
    handleUpdateList,
  } = useLists();

  const [color, setColor] = useState(list.color);
  const [listTitle, setListTitle] = useState(list.title);

  useEffect(() => {
    setListTitle(list.title);
    setColor(list.color);
  }, [list]);

  const handleInputChange = (e: InputChangeEventHandler) => {
    const { value } = e.target;
    setListTitle(value);
  };

  const updateList = async (listData: Partial<List>) => {
    await handleUpdateList(list._id, listData);
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
          onKeyPress={async (e) => {
            if (e.key === 'Enter') {
              await updateList({ title: listTitle });
            }
          }}
        />
      }
      open={isListDetailOpen}
      onClose={handleCloseSlideOver}
    >
      <ColorPicker
        color={color}
        setColor={async (c) => {
          await updateList({ color: c });
          setColor(c);
        }}
      />

      <DeleteList listTitle={list.title} id={list._id} />
    </SlideOver>
  );
};
