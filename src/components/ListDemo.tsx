import Link from 'next/link';
import { ReactNode, useState } from 'react';
import SlideOver from '@/components/SlideOver';
import { Menu } from '@headlessui/react';
import { Bars3BottomRightIcon } from '@heroicons/react/24/solid';
import { GenericEvent } from '@/types/events';
import { DeleteList } from '@/components/DeleteList';

interface ListDemoProps {
  _id: string;
  title: string;
  actions?: ReactNode | undefined;
}
export const ListDemo = ({ _id, title }: ListDemoProps) => {
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
          query: { listId: _id }
        }}>
        <div
          className="my-2.5
        transition-all cursor-pointer
         border-l-detail border-primary
         bg-white p-4 rounded-md font-semibold items-center
         flex align-middle hover:border-l-detail-hover shadow-sm">
          <h1>{title}</h1>
          <div className="ml-auto">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button
                onClick={handleClick}
                className="inline-flex w-full justify-center
                p-1 text-sm font-medium text-gray-700 hover:bg-gray-200
                focus:ring-offset-2 focus:ring-offset-gray-200 rounded-full">
                <Bars3BottomRightIcon className="h-6 w-6" />
              </Menu.Button>
            </Menu>
          </div>
        </div>
      </Link>
      <SlideOver title={title} open={open} setOpen={setOpen}>
        <DeleteList listTitle={title} _id={_id} />
      </SlideOver>
    </>
  );
};
