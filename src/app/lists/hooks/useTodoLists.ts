'use client';

import { type DropResult } from '@hello-pangea/dnd';
import axios from 'axios';
import { createContext, useEffect, useState } from 'react';

import type { GenericEvent } from '@/types/events';
import type { TodoList } from '@/types/main';

export type TodoListsState = {
  todoLists: TodoList[];
  currentTodoList: TodoList;

  isListDetailOpen: boolean;
  handleOpenSlideOver: (list: TodoList) => (e: GenericEvent) => void;
  handleCloseSlideOver: () => void;

  updateTodoListsOrder: (result: DropResult) => Promise<void>;
  handleAddTodoList: (newTodoList: TodoList) => Promise<void>;
  handleUpdateTodoList: (
    listId: string,
    updateTodoList: TodoList,
  ) => Promise<void>;
  handleDeleteTodoList: (listId: string) => Promise<void>;
};

export const useTodoLists = (lists: TodoList[]): TodoListsState => {
  const [todoLists, setTodoLists] = useState<TodoList[]>([] as TodoList[]);
  const [currentTodoList, setCurrentTodoList] = useState<TodoList>(
    {} as TodoList,
  );
  const [isListDetailOpen, setIsListDetailOpen] = useState(false);

  useEffect(() => {
    setTodoLists(lists);
  }, [lists]);

  const handleOpenSlideOver = (todoList: TodoList) => (e: GenericEvent) => {
    e.stopPropagation();
    setCurrentTodoList(todoList);
    setIsListDetailOpen(true);
  };

  const handleCloseSlideOver = () => {
    setIsListDetailOpen(false);
  };

  const handleAddTodoList = async (newTodoList: TodoList) => {
    const response = await axios.post<TodoList>('/api/lists', {
      ...newTodoList,
      index: lists.length - 1,
    });
    setTodoLists([...todoLists, response.data]);
  };

  const handleUpdateTodoList = async () =>
    // listId: string,
    // updatedTodoList: TodoList,
    {
      // await TodoListDb.update(listId, updatedTodoList);
    };

  const updateTodoListsOrder = async (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    let todoListsCopy = [...todoLists];
    const [movedElement] = todoListsCopy.splice(source.index, 1);
    todoListsCopy.splice(destination.index, 0, movedElement);
    todoListsCopy = todoListsCopy.map((list, index) => ({
      ...list,
      index,
    }));

    setTodoLists(todoListsCopy);

    await axios.put('api/lists/order', {
      initialIndex: source.index,
      destinationIndex: destination.index,
    });
  };

  const handleDeleteTodoList = async (listId: string) => {
    await axios.delete(`/api/lists/${listId}`);
    setTodoLists(todoLists.filter((list) => list._id !== listId));
    handleCloseSlideOver();
  };

  return {
    todoLists,
    currentTodoList,
    isListDetailOpen,
    handleOpenSlideOver,
    handleCloseSlideOver,
    handleAddTodoList,
    handleDeleteTodoList,

    updateTodoListsOrder,
    handleUpdateTodoList,
  };
};

export const TodoListsContext = createContext<TodoListsState>(
  {} as TodoListsState,
);
