import { FC, Fragment, MouseEventHandler } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import { GenericEvent } from '@/types/events';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Dropdown: FC = ({ children }) => {
  const handleClick = (e: GenericEvent) => e.stopPropagation();

  return (
    <Menu as="div" className="relative inline-block text-left" onClick={handleClick}>
      <div>
        <Menu.Button
          className="inline-flex w-full justify-center
                p-1 text-sm font-medium text-gray-700 hover:bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                focus:ring-offset-2 focus:ring-offset-gray-100">
          <EllipsisVerticalIcon className="h-6 w-6" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95">
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              <a href="#" className="text-gray-700 block px-4 py-2 text-sm">
                Settings
              </a>
            </Menu.Item>
            <Menu.Item>
              <a href="#" className="text-gray-700 block px-4 py-2 text-sm">
                Delete
              </a>
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default Dropdown;
