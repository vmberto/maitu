/* eslint-disable tailwindcss/no-custom-classname */
/* eslint-disable no-underscore-dangle */
import { Menu } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useContext } from 'react';

import { ListsContext } from '@/src/app/lists/hooks/useLists';
import { DraggableWrapper } from '@/src/components/dnd/DraggableWrapper';
import { Typography } from '@/src/components/Typography';
import { type List } from '@/types/main';

type ListDemoProps = {
  list: List;
};

export const ListDemo = ({ list }: ListDemoProps) => {
  const { handleOpenSlideOver } = useContext(ListsContext);

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
          className={`border-${list.color} flex cursor-pointer
         items-center rounded-md border-l-detail bg-white p-4 align-middle font-semibold
         shadow-sm transition-all active:opacity-50 betterhover:hover:border-l-detail-hover`}
        >
          <Typography as="h2">{list.title}</Typography>
          <Menu as="div" className="relative ml-auto inline-block text-left">
            <Menu.Button
              onClick={handleOpenSlideOver(list)}
              className="inline-flex w-full justify-center
                rounded-full p-1 text-sm font-medium text-gray-700
                focus:ring-offset-2 focus:ring-offset-gray-200 betterhover:hover:bg-gray-200"
            >
              <EllipsisVerticalIcon className="h-8 w-8" />
            </Menu.Button>
          </Menu>
        </div>
      </Link>
    </DraggableWrapper>
  );
};
