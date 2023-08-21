import React, { FC } from 'react';
import dynamic from 'next/dynamic';
const TodosProvider = dynamic(() => import('src/state/todos/TodosProvider'), { ssr: false });

export const AppContextProvider: FC = ({ children }) => <TodosProvider>{children}</TodosProvider>;
