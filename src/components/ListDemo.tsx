import Link from 'next/link';
import { ReactNode, useState } from 'react';
import SlideOver from 'src/components/SlideOver';
import { Menu } from '@headlessui/react';
import { Bars3BottomRightIcon } from '@heroicons/react/24/solid';
import { GenericEvent } from 'src/types/events';
import { DeleteList } from 'src/components/DeleteList';
import { TodoList } from 'src/types/main';
import { ColorPicker } from 'src/components/ColorPicker';
import { useTodoLists } from 'src/state/todo-lists/useTodoLists';
import { Button } from 'src/components/Button';

interface ListDemoProps {
  todoList: TodoList;
  actions?: ReactNode | undefined;
}
export const ListDemo = ({ todoList }: ListDemoProps) => {
  const { handleUpdateTodoList } = useTodoLists();
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(todoList.color);
  const [listTitle, setListTitle] = useState(todoList.title);

  const handleInputChange = (e: GenericEvent) => {
    const { value } = e.target;
    setListTitle(value);
  };

  const handleClick = (e: GenericEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  const saveChanges = async () => {
    await handleUpdateTodoList(todoList.id, { title: listTitle, color } as TodoList);
    setOpen(false);
  };

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
                <Bars3BottomRightIcon className="h-6 w-6" />
              </Menu.Button>
            </Menu>
          </div>
        </div>
      </Link>
      <SlideOver
        title={<input defaultValue={listTitle} onChange={handleInputChange} />}
        open={open}
        setOpen={setOpen}>
        <DeleteList listTitle={todoList.title} id={todoList.id} />
        <ColorPicker color={color} setColor={setColor} />
        <Button color={color} onClick={saveChanges} className="mt-10" type="button" />
      </SlideOver>
    </>
  );
};
