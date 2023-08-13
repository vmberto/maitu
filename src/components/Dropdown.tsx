import { FC, Fragment, MouseEventHandler } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Bars3BottomRightIcon } from '@heroicons/react/24/solid';
import { GenericEvent } from 'src/types/events';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Dropdown: FC = ({ children }) => {
  const handleClick = (e: GenericEvent) => e.stopPropagation();

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button
        onClick={handleClick}
        className="inline-flex w-full justify-center
                p-1 text-sm font-medium text-gray-700 hover:bg-gray-200
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                focus:ring-offset-2 focus:ring-offset-gray-200 rounded-full">
        <Bars3BottomRightIcon className="h-6 w-6" />
      </Menu.Button>
    </Menu>
  );
};

export default Dropdown;
