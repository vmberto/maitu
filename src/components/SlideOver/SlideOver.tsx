'use client';

import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Fragment, type ReactNode } from 'react';

import { useSwipeEvents } from '@/src/hooks/useSwipeEvents';
import { useSlideOver } from '@/src/providers/slideover.provider';

type SlideDirection = 'bottom' | 'right';

type ModalProps = {
  title: string | ReactNode;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  direction?: SlideDirection;
};

export const SlideOver = ({
  title,
  open,
  onClose,
  children,
  direction = 'bottom',
}: ModalProps) => {
  const { handleClearSlideOverData } = useSlideOver();

  const swipeActions = useSwipeEvents({
    onSwipedDown: () => {
      if (direction === 'bottom') onClose();
    },
    onSwipedRight: () => {
      if (direction === 'right') onClose();
    },
  });

  const getTransitionClasses = (dir: SlideDirection) => {
    if (dir === 'bottom') {
      return {
        enter: 'transform transition ease-in-out duration-500 sm:duration-500',
        enterFrom: 'translate-y-full',
        enterTo: 'translate-y-0',
        leave: 'transform transition ease-in-out duration-500 sm:duration-500',
        leaveFrom: 'translate-y-0',
        leaveTo: 'translate-y-full',
      };
    }
    return {
      enter: 'transform transition ease-in-out duration-500 sm:duration-500',
      enterFrom: 'translate-x-full',
      enterTo: 'translate-x-0',
      leave: 'transform transition ease-in-out duration-500 sm:duration-500',
      leaveFrom: 'translate-x-0',
      leaveTo: 'translate-x-full',
    };
  };

  const transitions = getTransitionClasses(direction);

  return (
    <Transition.Root
      show={open}
      as={Fragment}
      afterLeave={handleClearSlideOverData}
    >
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 flex justify-center overflow-hidden">
            <div
              className={`pointer-events-none fixed inset-y-0 flex max-w-full ${direction === 'right' ? 'right-0' : 'px-2'}`}
            >
              <Transition.Child
                as={Fragment}
                enter={transitions.enter}
                enterFrom={transitions.enterFrom}
                enterTo={transitions.enterTo}
                leave={transitions.leave}
                leaveFrom={transitions.leaveFrom}
                leaveTo={transitions.leaveTo}
              >
                <Dialog.Panel className="pointer-events-auto relative w-screen max-w-2xl">
                  <div
                    className={`${direction === 'bottom' ? 'mt-10 rounded-2xl' : 'rounded-l-2xl'} flex h-full flex-col overflow-y-scroll bg-white pb-6 shadow-xl`}
                  >
                    <div
                      className="sticky top-0 z-20 mb-5 flex w-full flex-row-reverse border-b-2 bg-white px-4 pb-3 pt-4 align-baseline sm:px-6"
                      {...swipeActions}
                    >
                      <button
                        type="button"
                        className="ml-auto self-start rounded-md text-gray-600 hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                        onClick={() => {
                          onClose();
                        }}
                      >
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="size-8" aria-hidden="true" />
                      </button>
                      <Dialog.Title className="grow text-lg font-medium text-gray-900">
                        {title}
                      </Dialog.Title>
                    </div>
                    <div className="relative mb-40 flex-1 px-4 sm:px-6">
                      {children}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
