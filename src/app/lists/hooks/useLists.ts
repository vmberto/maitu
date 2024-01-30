import { type DropResult } from '@hello-pangea/dnd';
import axios from 'axios';
import { createContext, useEffect, useState } from 'react';

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

export const useLists = (listsDb: List[]): ListsState => {
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

  const handleAddList = async (newList: List) => {
    const response = await axios.post<List>('/api/lists', {
      ...newList,
      index: lists.length - 1,
    });
    setLists([...lists, response.data]);
  };

  const handleUpdateList = async () =>
    // listId: string,
    // updatedList: List,
    {
      // await ListDb.update(listId, updatedList);
    };

  const updateListsOrder = async (result: DropResult) => {
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

    await axios.put('api/lists/order', {
      initialIndex: source.index,
      destinationIndex: destination.index,
    });
  };

  const handleDeleteList = async (listId: string) => {
    await axios.delete(`/api/lists/${listId}`);
    setLists(lists.filter((list) => list._id !== listId));
    handleCloseSlideOver();
  };

  return {
    lists,
    currentList,
    isListDetailOpen,
    handleOpenSlideOver,
    handleCloseSlideOver,
    handleAddList,
    handleDeleteList,

    updateListsOrder,
    handleUpdateList,
  };
};

export const ListsContext = createContext<ListsState>({} as ListsState);
