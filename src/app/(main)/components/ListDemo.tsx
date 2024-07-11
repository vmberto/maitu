/* eslint-disable tailwindcss/no-custom-classname */
/* eslint-disable no-underscore-dangle */
import { Menu } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

import { DraggableWrapper } from '@/src/components/dnd/DraggableWrapper';
import { Typography } from '@/src/components/Typography';
import { clickStyle } from '@/src/lib/style-consts';
import { useSlideOver } from '@/src/providers/slideover.provider';
import { type List } from '@/types/main';

type ListDemoProps = {
  list: List;
};

export const ListDemo = ({ list }: ListDemoProps) => {
  const { handleOpenSlideOver } = useSlideOver();

  return (
    <DraggableWrapper
      key={list._id.toString()}
      draggableId={list._id.toString()}
      index={list.index}
      className="mb-2"
    >
      <Link
        href={{
          pathname: '/tasks',
          query: { listId: list._id },
        }}
      >
        <div
          id={list._id}
          className={`flex items-center justify-center gap-2
          rounded-md border-2 border-gray-200 p-4 align-middle
          font-semibold shadow-sm shadow-gray-400 transition-all 
          active:opacity-30`}
        >
          <Typography as="h2" className="text-4xl">
            {list.emoji}
          </Typography>

          <Typography as="h2">{list.title}</Typography>

          <Menu as="div" className="relative ml-auto inline-block text-left">
            <Menu.Button
              onClick={handleOpenSlideOver(list)}
              className={`${clickStyle} inline-flex w-full justify-center
                rounded-full p-1 text-sm font-medium text-gray-700
                focus:ring-offset-2 focus:ring-offset-gray-200 betterhover:hover:bg-gray-200`}
            >
              <EllipsisVerticalIcon className="size-8" />
            </Menu.Button>
          </Menu>
        </div>
      </Link>
    </DraggableWrapper>
  );
};
