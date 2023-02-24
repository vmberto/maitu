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
  handleDeleteTodoList: (listId: string) => void;
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
    handleDeleteTodoList: async (listId) => {
      dispatch({ type: 'onDeleteTodoList', listId });
      const thisListTodos = await db.todos.where({ listId }).toArray();
      console.log(thisListTodos);
      await db.todos.bulkDelete(thisListTodos.map((l) => l._id));
      await db.todoLists.delete(listId);
    }
  };

  return <TodoListsContext.Provider value={value}>{children}</TodoListsContext.Provider>;
};

export default TodoListsProvider;
