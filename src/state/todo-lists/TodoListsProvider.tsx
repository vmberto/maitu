import { createContext, FC, useEffect, useReducer } from 'react';
import reducer from '@/state/todo-lists/useTodoListsReducer';
import * as TodoListDb from '@/lib/database/todoListDb';
import { TodoList } from '@/types/main';

export interface TodoListsState {
  todoLists: TodoList[];
}

interface TodoListsActions {
  handleAddTodoList: (ntl: TodoList) => void;
  handleDeleteTodoList: (listId: string) => void;
}

const initialState: TodoListsState = {
  todoLists: [] as TodoList[]
};

export const TodoListsContext = createContext({} as TodoListsState & TodoListsActions);

const TodoListsProvider: FC = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      const todoLists = await TodoListDb.get();
      dispatch({ type: 'setTodoLists', todoLists });
    })();
  }, []);

  const value: TodoListsState & TodoListsActions = {
    ...state,
    handleAddTodoList: async (newTodoList) => {
      dispatch({ type: 'onAddTodoList', newTodoList });
      await TodoListDb.add(newTodoList);
    },
    handleDeleteTodoList: async (listId) => {
      dispatch({ type: 'onDeleteTodoList', listId });
      await TodoListDb.remove(listId);
    }
  };

  return <TodoListsContext.Provider value={value}>{children}</TodoListsContext.Provider>;
};

export default TodoListsProvider;
