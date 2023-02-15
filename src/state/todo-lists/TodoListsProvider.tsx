import { TodoList } from '@/types/main';
import { createContext, FC, useReducer } from 'react';
import reducer from '@/state/todo-lists/useTodoListsReducer';
import axios from 'axios';

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

  const value: TodoListsState & TodoListsActions = {
    todoLists: state.todoLists,
    handleAddTodoList: async (newTodoList) => {
      dispatch({ type: 'onAddTodoList', newTodoList });
      await axios.post(`${process.env.NEXT_PUBLIC_APP_URI}/api/todo-lists`, newTodoList);
    },
    handleDeleteTodoList: async (todoList) => {
      dispatch({ type: 'onDeleteTodoList', todoList });
      await axios.delete(
        `${process.env.NEXT_PUBLIC_APP_URI}/api/todo-lists?listId=${todoList._id}`
      );
    }
  };

  return <TodoListsContext.Provider value={value}>{children}</TodoListsContext.Provider>;
};

export default TodoListsProvider;
