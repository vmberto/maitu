import { createContext } from 'react';
import type { TodosState } from 'src/hooks/useTodos';

export const TodosContext = createContext<TodosState>({} as TodosState);
