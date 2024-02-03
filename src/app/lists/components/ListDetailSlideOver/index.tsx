import { useState } from 'react';

import { DeleteList } from '@/src/app/lists/components/ListDetailSlideOver/DeleteList';
import { useLists } from '@/src/app/lists/provider';
import { ColorPicker } from '@/src/components/ColorPicker';
import SlideOver from '@/src/components/SlideOver';

export const ListDetailSlideOver = () => {
  const {
    currentList: list,
    isListDetailOpen,
    handleCloseSlideOver,
  } = useLists();

  // const {handleUpdateList} = useLists();
  const [color, setColor] = useState(list.color);
  // const [listTitle, setListTitle] = useState(list.title);

  // useEffect(() => {
  //   setListTitle(list.title);
  // }, [list]);

  // const handleInputChange = (e: InputChangeEventHandler) => {
  //   const { value } = e.target;
  //   setListTitle(value);
  // };
  //
  // const handleDefineTitle = () => {
  //   if (listTitle) {
  //     // setDefinedListTitle(listTitle);
  //   } else {
  //     setListTitle(list.title);
  //   }
  // };

  // @Todo refactor 100%
  // useEffect(() => {
  //     (async () => {
  //         await handleUpdateList(list.id, {title: definedListTitle, color} as List);
  //     })();
  // }, [color, definedListTitle]);

  // <input
  //   id="title-input"
  //   maxLength={30}
  //   value={listTitle}
  //   className="w-full leading-7 focus:outline-0"
  //   onChange={handleInputChange}
  //   onBlur={handleDefineTitle}
  //   onKeyPress={(e) => {
  //     if (e.key === 'Enter') {
  //       handleDefineTitle();
  //     }
  //   }}
  // />

  return (
    <SlideOver
      title={list.title}
      open={isListDetailOpen}
      onClose={handleCloseSlideOver}
    >
      <ColorPicker color={color} setColor={setColor} />

      <DeleteList listTitle={list.title} id={list._id} />
    </SlideOver>
  );
};
