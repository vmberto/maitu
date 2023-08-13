import { createContext, FC, useReducer } from 'react';
import reducer from 'src/state/todo-lists/useTodoListsReducer';
import * as TodoListDb from 'src/lib/database/todoListDb';
import { TodoList } from 'src/types/main';
import { useLiveQuery } from 'dexie-react-hooks';
import { Db } from 'src/lib/database';

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

  useLiveQuery(async () => {
    const todoLists = await TodoListDb.get();
    dispatch({ type: 'setTodoLists', todoLists });
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
