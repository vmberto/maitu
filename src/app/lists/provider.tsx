'use client';

import { type DropResult } from '@hello-pangea/dnd';
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { add, remove, update, updateOrder } from '@/src/server/lists.service';
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
  listsDb: List[];
  children: ReactNode;
};

const ListsContext = createContext<ListsState>({} as ListsState);

export const ListsProvider = ({ listsDb, children }: ListsProviderProps) => {
  const [lists, setLists] = useState<List[]>([]);

  useEffect(() => {
    setLists(listsDb);
  }, [listsDb]);

  const handleAddList = useCallback(
    async (newList: List) => {
      const newListResponse = await add({
        ...newList,
        index: lists.length - 1,
      });

      setLists([...lists, newListResponse]);
    },
    [lists],
  );

  const handleUpdateList = async (id: string, updatedData: Partial<List>) => {
    await update(id, updatedData);
  };

  const updateListsOrder = useCallback(
    async (result: DropResult) => {
      const { source, destination } = result;

      if (!destination) return;

      let listsCopy = [...lists];
      const [movedElement] = listsCopy.splice(source.index, 1);
      listsCopy.splice(destination.index, 0, movedElement);
      listsCopy = listsCopy.map((list, index) => ({
        ...list,
        index,
      }));

      setLists(listsCopy);

      await updateOrder({
        initialIndex: source.index,
        destinationIndex: destination.index,
      });
    },
    [lists],
  );

  const handleDeleteList = useCallback(
    async (listId: string) => {
      setLists(lists.filter((list) => list._id !== listId));
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
    [handleAddList, handleDeleteList, lists, updateListsOrder],
  );

  return (
    <ListsContext.Provider value={contextValue}>
      {children}
    </ListsContext.Provider>
  );
};

export const useLists = (): ListsState => useContext(ListsContext);
