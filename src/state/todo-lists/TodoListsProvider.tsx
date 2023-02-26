import { TodoList } from '@/types/main';
import { createContext, FC, useEffect, useReducer } from 'react';
import reducer from '@/state/todo-lists/useTodoListsReducer';
import { db } from '@/lib/local-data';

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
      const todoLists = (await db.todoLists.toArray()) || [];
      dispatch({ type: 'setTodoLists', todoLists });
    })();
  }, []);

  const value: TodoListsState & TodoListsActions = {
    ...state,
    handleAddTodoList: async (newTodoList) => {
      dispatch({ type: 'onAddTodoList', newTodoList });
      await db.todoLists.add(newTodoList);
    },
    handleDeleteTodoList: async (listId) => {
      dispatch({ type: 'onDeleteTodoList', listId });
      const thisListTodos = await db.todos.where({ listId }).toArray();
      await db.todos.bulkDelete(thisListTodos.map((l) => l._id));
      await db.todoLists.delete(listId);
    }
  };

  return <TodoListsContext.Provider value={value}>{children}</TodoListsContext.Provider>;
};

export default TodoListsProvider;
