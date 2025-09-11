'use client';

import type { DropResult } from '@hello-pangea/dnd';
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { add, remove, update, updateOrder } from '@/src/actions/lists.action';
import type { List } from '@/types/main';

export type ListsState = {
  lists: List[];

  updateListsOrder: (result: DropResult) => Promise<void>;
  handleAddList: (newList: List) => Promise<void>;
  handleUpdateList: (
    listId: string,
    updateList: Partial<List>,
  ) => Promise<void>;
  handleDeleteList: (listId: string) => Promise<void>;
};

type ListsProviderProps = {
  listsDb?: List[];
  children: ReactNode;
};

const ListsContext = createContext<ListsState>({} as ListsState);

export const ListsProvider = ({
  listsDb = [],
  children,
}: ListsProviderProps) => {
  const [lists, setLists] = useState<List[]>([]);

  useEffect(() => {
    if (listsDb.length > 0) {
      setLists(listsDb);
    }
  }, [listsDb]);

  const handleAddList = useCallback(
    async (newList: List) => {
      const newListResponse = await add({
        ...newList,
        index: lists.length,
      });

      const updated = [...lists, newListResponse];
      setLists(updated);
    },
    [lists],
  );

  const handleUpdateList = async (id: string, updatedData: Partial<List>) => {
    await update(id, updatedData);
    const updated = lists.map((list) =>
      list._id === id ? { ...list, ...updatedData } : list,
    );
    setLists(updated);
  };

  const updateListsOrder = useCallback(
    async (result: DropResult) => {
      const { source, destination } = result;

      if (!destination) return;

      const listsCopy = [...lists];
      const [movedElement] = listsCopy.splice(source.index, 1);
      listsCopy.splice(destination.index, 0, movedElement);

      const reordered = listsCopy.map((list, index) => ({
        ...list,
        index,
      }));

      setLists(reordered);

      await updateOrder({
        initialIndex: source.index,
        destinationIndex: destination.index,
      });
    },
    [lists],
  );

  const handleDeleteList = useCallback(
    async (listId: string) => {
      const filtered = lists.filter((list) => list._id !== listId);
      setLists(filtered);
      await remove(listId);
    },
    [lists],
  );

  const contextValue = useMemo(
    () => ({
      lists,
      handleAddList,
      handleDeleteList,
      updateListsOrder,
      handleUpdateList,
    }),
    [lists, handleAddList, handleDeleteList, updateListsOrder],
  );

  return (
    <ListsContext.Provider value={contextValue}>
      {children}
    </ListsContext.Provider>
  );
};

export const useLists = (): ListsState => useContext(ListsContext);
