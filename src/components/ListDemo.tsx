import Link from 'next/link';
import { ReactNode, useState } from 'react';
import SlideOver from '@/components/SlideOver';
import { Menu } from '@headlessui/react';
import { Bars3BottomRightIcon } from '@heroicons/react/24/solid';
import { GenericEvent } from '@/types/events';
import { DeleteList } from '@/components/DeleteList';
import { TodoList } from '@/types/main';

interface ListDemoProps {
  todoList: TodoList;
  actions?: ReactNode | undefined;
}
export const ListDemo = ({ todoList }: ListDemoProps) => {
  const [open, setOpen] = useState(false);

  const handleClick = (e: GenericEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      <Link
        href={{
          pathname: '/todos',
          query: { listId: todoList._id }
        }}>
        <div
          className={`my-2.5
        transition-all cursor-pointer
         border-l-detail border-${todoList.color}
         bg-white p-4 rounded-md font-semibold items-center
         flex align-middle betterhover:border-l-detail-hover shadow-sm`}>
          <h1>{todoList.title}</h1>
          <div className="ml-auto">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button
                onClick={handleClick}
                className="inline-flex w-full justify-center
                p-1 text-sm font-medium text-gray-700 betterhover:bg-gray-200
                focus:ring-offset-2 focus:ring-offset-gray-200 rounded-full">
                <Bars3BottomRightIcon className="h-6 w-6" />
              </Menu.Button>
            </Menu>
          </div>
        </div>
      </Link>
      <SlideOver title={todoList.title} open={open} setOpen={setOpen}>
        <DeleteList listTitle={todoList.title} _id={todoList._id} />
      </SlideOver>
    </>
  );
};
