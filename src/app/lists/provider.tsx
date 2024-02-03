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

import { add, remove, updateOrder } from '@/src/actions/lists.service';
import type { GenericEvent } from '@/types/events';
import type { List } from '@/types/main';

export type ListsState = {
  lists: List[];
  currentList: List;

  isListDetailOpen: boolean;
  handleOpenSlideOver: (list: List) => (e: GenericEvent) => void;
  handleCloseSlideOver: () => void;

  updateListsOrder: (result: DropResult) => Promise<void>;
  handleAddList: (newList: List) => Promise<void>;
  handleUpdateList: (listId: string, updateList: List) => Promise<void>;
  handleDeleteList: (listId: string) => Promise<void>;
};

type ListsProviderProps = {
  listsDb: List[];
  children: ReactNode;
};

const ListsContext = createContext<ListsState>({} as ListsState);

export const ListsProvider = ({ listsDb, children }: ListsProviderProps) => {
  const [lists, setLists] = useState<List[]>([]);
  const [currentList, setCurrentList] = useState<List>({} as List);
  const [isListDetailOpen, setIsListDetailOpen] = useState(false);

  useEffect(() => {
    setLists(listsDb);
  }, []);

  const handleOpenSlideOver = (list: List) => (e: GenericEvent) => {
    e.stopPropagation();
    setCurrentList(list);
    setIsListDetailOpen(true);
  };

  const handleCloseSlideOver = () => {
    setIsListDetailOpen(false);
  };

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

  const handleUpdateList = async () => {};

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
      handleCloseSlideOver();
    },
    [lists],
  );

  const contextValue = useMemo(
    () => ({
      lists,
      currentList,
      isListDetailOpen,
      handleOpenSlideOver,
      handleCloseSlideOver,
      handleAddList,
      handleDeleteList,

      updateListsOrder,
      handleUpdateList,
    }),
    [
      currentList,
      handleAddList,
      handleDeleteList,
      isListDetailOpen,
      lists,
      updateListsOrder,
    ],
  );

  return (
    <ListsContext.Provider value={contextValue}>
      {children}
    </ListsContext.Provider>
  );
};

export const useLists = (): ListsState => useContext(ListsContext);
