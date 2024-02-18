import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import type { GenericEvent } from '@/types/events';

export type ModalsState = {
  modalData: any;
  handleOpenSlideOver: (modalData: any) => (e: GenericEvent) => void;
  handleCloseSlideOver: () => void;
};

const ModalContext = createContext<ModalsState>({} as ModalsState);

type ModalProviderProps = {
  children: ReactNode;
};

export const ModalsProvider = ({ children }: ModalProviderProps) => {
  const [modalData, setModalData] = useState<any>();

  const handleOpenSlideOver = (data: any) => (e: GenericEvent) => {
    e.stopPropagation();
    setModalData(data);
  };

  const handleCloseSlideOver = () => {
    setModalData({});
  };

  const contextValue = useMemo(
    () => ({
      modalData,
      handleOpenSlideOver,
      handleCloseSlideOver,
    }),
    [modalData],
  );

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModals = (): ModalsState => useContext(ModalContext);
