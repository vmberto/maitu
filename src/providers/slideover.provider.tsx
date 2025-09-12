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

  const handleOpenSlideOver = useCallback(
    (data: T) => (e: GenericEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSlideOverData(data);
      setOpen(true);
    },
    [],
  );

  const handleClearSlideOverData = () => {
    setSlideOverData(undefined);
  };

  const handleCloseSlideOver = () => {
    setOpen(false);
  };

  const contextValue = useMemo(
    () => ({
      modalData: slideOverData,
      isOpen,
      handleOpenSlideOver,
      handleCloseSlideOver,
      handleClearSlideOverData,
    }),
    [handleOpenSlideOver, isOpen, slideOverData],
  );

  return (
    <SlideOverContext.Provider value={contextValue}>
      {children}
    </SlideOverContext.Provider>
  );
};

export const useSlideOver = <T extends unknown>(): SlideOverState<T> =>
  useContext(SlideOverContext);
