import {FC, Fragment, ReactNode} from 'react';
import {Dialog, Transition} from '@headlessui/react';
import {XMarkIcon} from '@heroicons/react/20/solid';
import {useSwipeEvents} from 'src/hooks/useSwipeEvents';

interface ModalProps {
    title: string | ReactNode;
    open: boolean;
    setOpen: (open: boolean) => void;
}

const SlideOver: FC<ModalProps> = ({title, open, setOpen, children}) => {
    const swipe = useSwipeEvents({onSwipedDown: () => setOpen(false)});

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={setOpen}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"/>
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute flex justify-center inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 flex max-w-full px-2">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-y-full"
                                enterTo="translate-y-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-y-0"
                                leaveTo="translate-y-full">
                                <Dialog.Panel className="pointer-events-auto relative w-screen max-w-2xl">
                                    <div
                                        className="flex h-full flex-col overflow-y-scroll mt-20 bg-white pb-6 shadow-xl">
                                        <div
                                            className="px-4 pt-4 pb-3 mb-5 sm:px-6 w-full flex align-baseline z-10 bg-white border-b-2"
                                            {...swipe}>
                                            <Dialog.Title className="text-lg flex-grow font-medium text-gray-900">
                                                {title}
                                            </Dialog.Title>
                                            <button
                                                type="button"
                                                className="ml-auto rounded-md text-gray-600 hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                                                onClick={() => setOpen(false)}>
                                                <span className="sr-only">Close panel</span>
                                                <XMarkIcon className="h-8 w-8" aria-hidden="true"/>
                                            </button>
                                        </div>
                                        <div className="relative mb-40 flex-1 px-4 sm:px-6">{children}</div>
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
