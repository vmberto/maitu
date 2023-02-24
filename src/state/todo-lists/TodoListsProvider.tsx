import { TodoList } from '@/types/main';
import { createContext, FC, useEffect, useReducer } from 'react';
import reducer from '@/state/todo-lists/useTodoListsReducer';
import axios from 'axios';
import { db } from '@/lib/local-data';

export interface TodoListsState {
  todoLists: TodoList[];
}

interface TodoListsActions {
  handleAddTodoList: (nt: TodoList) => void;
  handleDeleteTodoList: (t: TodoList) => void;
}

const initialState = (todoLists: TodoList[]) =>
  ({
    todoLists
  } as TodoListsState);

export const TodoListsContext = createContext({} as TodoListsState & TodoListsActions);

interface TodoListsProviderProps {
  todoLists: TodoList[];
}
const TodoListsProvider: FC<TodoListsProviderProps> = ({ todoLists, children }) => {
  const [state, dispatch] = useReducer(reducer, initialState(todoLists));

  useEffect(() => dispatch({ type: 'setTodoLists', todoLists }), [todoLists]);

  const value: TodoListsState & TodoListsActions = {
    todoLists: state.todoLists,
    handleAddTodoList: async (newTodoList) => {
      dispatch({ type: 'onAddTodoList', newTodoList });
      await db.todoLists.add(newTodoList);
    },
    handleDeleteTodoList: async (todoList) => {
      dispatch({ type: 'onDeleteTodoList', todoList });
      await db.todoLists.delete(todoList._id);
    }
  };

  return <TodoListsContext.Provider value={value}>{children}</TodoListsContext.Provider>;
};

export default TodoListsProvider;
