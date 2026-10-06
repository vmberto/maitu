'use client';

import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { GenericEvent } from '@/types/events';

export type SlideOverState<T> = {
  modalData: T | undefined;
  isOpen: boolean;
  openSlideOver: (modalData: T) => void;
  handleOpenSlideOver: (modalData: T) => (e: GenericEvent) => void;
  handleClearSlideOverData: () => void;
  handleCloseSlideOver: () => void;
};

const SlideOverContext = createContext<SlideOverState<any>>(
  {} as SlideOverState<any>,
);

type ModalProviderProps = {
  children: ReactNode;
};

export const SlideOverProvider = <T extends unknown>({
  children,
}: ModalProviderProps) => {
  const [isOpen, setOpen] = useState<boolean>(false);
  const [slideOverData, setSlideOverData] = useState<T>();

  const openSlideOver = useCallback((data: T) => {
    setSlideOverData(data);
    setOpen(true);
  }, []);

  const handleOpenSlideOver = useCallback(
    (data: T) => (e: GenericEvent) => {
      e.preventDefault();
      e.stopPropagation();
      openSlideOver(data);
    },
    [openSlideOver],
  );

  const handleClearSlideOverData = useCallback(() => {
    setSlideOverData(undefined);
  }, []);

  const handleCloseSlideOver = useCallback(() => {
    setOpen(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      modalData: slideOverData,
      isOpen,
      openSlideOver,
      handleOpenSlideOver,
      handleCloseSlideOver,
      handleClearSlideOverData,
    }),
    [
      openSlideOver,
      handleOpenSlideOver,
      handleCloseSlideOver,
      handleClearSlideOverData,
      isOpen,
      slideOverData,
    ],
  );

  return (
    <SlideOverContext.Provider value={contextValue}>
      {children}
    </SlideOverContext.Provider>
  );
};

export const useSlideOver = <T extends unknown>(): SlideOverState<T> =>
  useContext(SlideOverContext);
