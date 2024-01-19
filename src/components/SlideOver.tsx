import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Fragment, type ReactNode } from 'react';

import { useSwipeEvents } from '@/src/hooks/useSwipeEvents';

type ModalProps = {
  title: string | ReactNode;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

const SlideOver = ({ title, open, onClose, children }: ModalProps) => {
  const swipe = useSwipeEvents({
    onSwipedDown: () => {
      onClose();
    },
  });

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
            <div className="pointer-events-none fixed inset-y-0 flex max-w-full px-2">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300 sm:duration-300"
                enterFrom="translate-y-full"
                enterTo="translate-y-0"
                leave="transform transition ease-in-out duration-300 sm:duration-300"
                leaveFrom="translate-y-0"
                leaveTo="translate-y-full"
              >
                <Dialog.Panel className="pointer-events-auto relative w-screen max-w-2xl">
                  <div className="mt-20 flex h-full flex-col overflow-y-scroll bg-white pb-6 shadow-xl">
                    <div
                      className="z-10 mb-5 flex w-full border-b-2 bg-white px-4 pb-3 pt-4 align-baseline sm:px-6"
                      {...swipe}
                    >
                      <Dialog.Title className="grow text-lg font-medium text-gray-900">
                        {title}
                      </Dialog.Title>
                      <button
                        type="button"
                        className="ml-auto rounded-md text-gray-600 hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                        onClick={() => {
                          onClose();
                        }}
                      >
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="h-8 w-8" aria-hidden="true" />
                      </button>
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

export default SlideOver;
