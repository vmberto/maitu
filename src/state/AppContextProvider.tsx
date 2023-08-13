import React, { FC } from 'react';
import dynamic from 'next/dynamic';
const TodosProvider = dynamic(() => import('src/state/todos/TodosProvider'), { ssr: false });
const TodoListsProvider = dynamic(() => import('src/state/todo-lists/TodoListsProvider'), {
  ssr: false
});

export const AppContextProvider: FC = ({ children }) => (
  <TodoListsProvider>
    <TodosProvider>{children}</TodosProvider>
  </TodoListsProvider>
);
