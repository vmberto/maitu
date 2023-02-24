import React, { FC } from 'react';
import dynamic from 'next/dynamic';
const TodosProvider = dynamic(() => import('@/state/todos/TodosProvider'), { ssr: false });
const TodoListsProvider = dynamic(() => import('@/state/todo-lists/TodoListsProvider'), {
  ssr: false
});

export const AppContextProvider: FC = ({ children }) => (
  <TodoListsProvider>
    <TodosProvider>{children}</TodosProvider>
  </TodoListsProvider>
);
