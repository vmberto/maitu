/* eslint-disable tailwindcss/no-custom-classname */
/* eslint-disable no-underscore-dangle */
import { Menu } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

import { useLists } from '@/src/app/lists/provider';
import { DraggableWrapper } from '@/src/components/dnd/DraggableWrapper';
import { Typography } from '@/src/components/Typography';
import { type List } from '@/types/main';

type ListDemoProps = {
  list: List;
};

export const ListDemo = ({ list }: ListDemoProps) => {
  const { handleOpenSlideOver } = useLists();

  return (
    <DraggableWrapper
      key={list._id.toString()}
      draggableId={list._id.toString()}
      index={list.index}
      className="mb-2"
    >
      <Link
        href={{
          pathname: '/todos',
          query: { listId: list._id },
        }}
      >
        <div
          id={list._id}
          className={`border-${list.color} flex items-center rounded-md border-2 
          border-l-8 border-y-gray-100 border-r-gray-100 p-4 align-middle font-semibold 
          drop-shadow-sm transition-all hover:border-l-detail-hover active:opacity-50`}
        >
          <Typography as="h2">{list.title}</Typography>
          <Menu as="div" className="relative ml-auto inline-block text-left">
            <Menu.Button
              onClick={handleOpenSlideOver(list)}
              className="inline-flex w-full justify-center
                rounded-full p-1 text-sm font-medium text-gray-700
                focus:ring-offset-2 focus:ring-offset-gray-200 betterhover:hover:bg-gray-200"
            >
              <EllipsisVerticalIcon className="size-8" />
            </Menu.Button>
          </Menu>
        </div>
      </Link>
    </DraggableWrapper>
  );
};
