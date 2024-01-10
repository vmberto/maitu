import { useState } from 'react';
import { ColorPicker } from 'src/ui/common/ColorPicker';
import SlideOver from 'src/ui/common/SlideOver';
import { DeleteList } from 'src/ui/view/TodoListsView/components/ListDetailSlideOver/DeleteList';

import { type GenericEvent } from '../../../../../../types/events';
import { type TodoList } from '../../../../../../types/main';

// import {useTodoLists} from 'src/hooks/useTodoLists';

type ListDetailSlideOverProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  todoList: TodoList;
};

export const ListDetailSlideOver = ({
  open,
  setOpen,
  todoList,
}: ListDetailSlideOverProps) => {
  // const {handleUpdateTodoList} = useTodoLists();
  const [color, setColor] = useState(todoList.color);
  const [listTitle, setListTitle] = useState(todoList.title);
  // const [definedListTitle, setDefinedListTitle] = useState(todoList.title);

  const handleInputChange = (e: GenericEvent) => {
    const { value } = e.target;
    setListTitle(value);
  };

  const handleDefineTitle = () => {
    if (listTitle) {
      // setDefinedListTitle(listTitle);
    } else {
      setListTitle(todoList.title);
    }
  };

  // @Todo refactor 100%
  // useEffect(() => {
  //     (async () => {
  //         await handleUpdateTodoList(todoList.id, {title: definedListTitle, color} as TodoList);
  //     })();
  // }, [color, definedListTitle]);

  return (
    <SlideOver
      title={
        <input
          id="title-input"
          maxLength={30}
          tabIndex={-1}
          defaultValue={listTitle}
          className="w-full leading-7 focus:outline-0"
          onChange={handleInputChange}
          onBlur={handleDefineTitle}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleDefineTitle();
            }
          }}
        />
      }
      open={open}
      setOpen={setOpen}
    >
      <ColorPicker color={color} setColor={setColor} />

      <DeleteList listTitle={todoList.title} id={todoList.id} />
    </SlideOver>
  );
};
