import { createContext, FC, useEffect, useReducer } from 'react';
import reducer from '@/state/todos/useTodoReducer';
import axios from 'axios';
import { Todo } from '@/types/main';
import { GenericEvent } from '@/types/events';
import mongoObjectId from '@/lib/generateUniqueId';
import { db } from '@/lib/local-data';
import { useRouter } from 'next/router';

export interface TodosState {
  listTitle: string;
  listId: string;
  todos: Todo[];

  newTodo: Todo;
}

interface TodosActions {
  handleChange: (index: number) => (e: GenericEvent) => void;
  handleChangeNewTodo: (e: GenericEvent) => void;
  handleAddTodo: () => void;
  handleRemoveTodo: (_id: string, index: number) => void;
  handleUpdateTodo: (t: Todo) => void;
}

const initialState = (listId: any) =>
  ({ listId, listTitle: '', todos: [], newTodo: {} as Todo } as TodosState);

export const TodosContext = createContext({} as TodosState & TodosActions);

interface TodosProviderProps {}
const TodosProvider: FC<TodosProviderProps> = ({ children }) => {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const [state, dispatch] = useReducer(reducer, initialState(id));

  useEffect(() => {
    (async () => {
      const todos = (await db.todos.where({ listId: id }).toArray()) || [];
      const { title } = (await db.todoLists.where({ _id: id }).first()) || {};
      dispatch({ type: 'setTodos', title, todos });
    })();
  }, []);

  const value: TodosState & TodosActions = {
    ...state,
    handleChange: (index) => (e) => dispatch({ type: 'onChangeTodo', index, e }),
    handleChangeNewTodo: (e) => dispatch({ type: 'onChangeNewTodo', e }),
    handleAddTodo: async () => {
      const addedTodo = { _id: mongoObjectId(), listId: id, title: state.newTodo.title } as Todo;
      dispatch({ type: 'addTodo', addedTodo });
      await db.todos.add(addedTodo);
      await axios.post(`${process.env.NEXT_PUBLIC_APP_URI}/api/todos`, addedTodo);
    },
    handleRemoveTodo: async (_id, index) => {
      dispatch({ type: 'removeTodo', index });
      await axios.delete(`${process.env.NEXT_PUBLIC_APP_URI}/api/todos?listId=${_id}`);
    },
    handleUpdateTodo: async (t) => {
      await axios.put(`${process.env.NEXT_PUBLIC_APP_URI}/api/todos`, t);
    }
  };

  return <TodosContext.Provider value={value}>{children}</TodosContext.Provider>;
};

export default TodosProvider;
