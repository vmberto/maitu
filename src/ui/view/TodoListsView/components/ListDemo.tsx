import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import SlideOver from 'src/ui/common/SlideOver';
import { Menu } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import { GenericEvent } from 'src/types/events';
import { DeleteList } from 'src/ui/view/TodoListsView/components/DeleteList';
import { TodoList } from 'src/types/main';
import { ColorPicker } from 'src/ui/common/ColorPicker';
import { useTodoLists } from 'src/state/todo-lists/useTodoLists';

interface ListDemoProps {
  todoList: TodoList;
  actions?: ReactNode | undefined;
}
export const ListDemo = ({ todoList }: ListDemoProps) => {
  const { handleUpdateTodoList } = useTodoLists();
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(todoList.color);
  const [listTitle, setListTitle] = useState(todoList.title);
  const [definedListTitle, setDefinedListTitle] = useState(todoList.title);

  const handleInputChange = (e: GenericEvent) => {
    const { value } = e.target;
    setListTitle(value);
  };

  const handleDefineTitle = () => {
    if (listTitle) {
      setDefinedListTitle(listTitle);
    } else {
      setListTitle(todoList.title);
    }
  };

  const handleClick = (e: GenericEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  useEffect(() => {
    (async () => {
      await handleUpdateTodoList(todoList.id, { title: definedListTitle, color } as TodoList);
    })();
  }, [color, definedListTitle]);

  return (
    <>
      <Link
        href={{
          pathname: '/todos',
          query: { listId: todoList.id }
        }}>
        <div
          className={`my-2.5
        transition-all cursor-pointer active:opacity-50
         border-l-detail border-${todoList.color}
         bg-white p-4 rounded-md font-semibold items-center
         flex align-middle betterhover:hover:border-l-detail-hover shadow-sm`}>
          <h1>{todoList.title}</h1>
          <div className="ml-auto">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button
                onClick={handleClick}
                className="inline-flex w-full justify-center
                p-1 text-sm font-medium text-gray-700 betterhover:hover:bg-gray-200
                focus:ring-offset-2 focus:ring-offset-gray-200 rounded-full">
                <EllipsisVerticalIcon className="h-8 w-8" />
              </Menu.Button>
            </Menu>
          </div>
        </div>
      </Link>
      <SlideOver
        title={
          <input
            id="title-input"
            maxLength={30}
            tabIndex={-1}
            defaultValue={listTitle}
            className="focus:outline-0 w-full leading-7"
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
        setOpen={setOpen}>
        <ColorPicker color={color} setColor={setColor} />

        <DeleteList listTitle={todoList.title} id={todoList.id} />
      </SlideOver>
    </>
  );
};
