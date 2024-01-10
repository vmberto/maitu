/* eslint-disable tailwindcss/no-custom-classname */
import { Menu } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useState } from 'react';
import { DraggableWrapper } from 'src/ui/common/dnd/DraggableWrapper';
import { Typography } from 'src/ui/common/Typography';
import { ListDetailSlideOver } from 'src/ui/view/TodoListsView/components/ListDetailSlideOver';
import { type GenericEvent } from 'types/events';
import { type TodoList } from 'types/main';

type ListDemoProps = {
  todoList: TodoList;
};

export const ListDemo = ({ todoList }: ListDemoProps) => {
  const [open, setOpen] = useState(false);

  const handleClick = (e: GenericEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <DraggableWrapper
      key={todoList.id}
      draggableId={todoList.id}
      index={todoList.index}
      className="mb-2"
    >
      <Link
        href={{
          pathname: '/todos',
          query: { listId: todoList.id },
        }}
      >
        <div
          className={`border-${todoList.color} flex cursor-pointer
         items-center rounded-md border-l-detail bg-white p-4 align-middle font-semibold
         shadow-sm transition-all active:opacity-50 betterhover:hover:border-l-detail-hover`}
        >
          <Typography as="h2">{todoList.title}</Typography>
          <Menu as="div" className="relative ml-auto inline-block text-left">
            <Menu.Button
              onClick={handleClick}
              className="inline-flex w-full justify-center
                rounded-full p-1 text-sm font-medium text-gray-700
                focus:ring-offset-2 focus:ring-offset-gray-200 betterhover:hover:bg-gray-200"
            >
              <EllipsisVerticalIcon className="h-8 w-8" />
            </Menu.Button>
          </Menu>
        </div>
        <ListDetailSlideOver
          open={open}
          setOpen={setOpen}
          todoList={todoList}
        />
      </Link>
    </DraggableWrapper>
  );
};
