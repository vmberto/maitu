'use client';

import { useContext, useState } from 'react';

import { DeleteList } from '@/src/app/lists/components/ListDetailSlideOver/DeleteList';
import { TodoListsContext } from '@/src/app/lists/hooks/useTodoLists';
import { ColorPicker } from '@/src/components/ColorPicker';
import SlideOver from '@/src/components/SlideOver';

export const ListDetailSlideOver = () => {
  const {
    currentTodoList: todoList,
    isListDetailOpen,
    handleCloseSlideOver,
  } = useContext(TodoListsContext);

  // const {handleUpdateTodoList} = useTodoLists();
  const [color, setColor] = useState(todoList.color);
  // const [listTitle, setListTitle] = useState(todoList.title);

  // useEffect(() => {
  //   setListTitle(todoList.title);
  // }, [todoList]);

  // const handleInputChange = (e: InputChangeEventHandler) => {
  //   const { value } = e.target;
  //   setListTitle(value);
  // };
  //
  // const handleDefineTitle = () => {
  //   if (listTitle) {
  //     // setDefinedListTitle(listTitle);
  //   } else {
  //     setListTitle(todoList.title);
  //   }
  // };

  // @Todo refactor 100%
  // useEffect(() => {
  //     (async () => {
  //         await handleUpdateTodoList(todoList.id, {title: definedListTitle, color} as TodoList);
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
      title={todoList.title}
      open={isListDetailOpen}
      onClose={handleCloseSlideOver}
    >
      <ColorPicker color={color} setColor={setColor} />

      <DeleteList listTitle={todoList.title} id={todoList._id} />
    </SlideOver>
  );
};
