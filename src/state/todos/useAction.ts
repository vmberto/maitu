import { useReducer } from 'react';
import reducer from '@/state/todos/useTodoReducer';
import { Todo } from '@/types/main';
import mongoObjectId from '@/lib/generateUniqueId';
import { GenericEvent } from '@/types/events';
import axios from 'axios';

export interface TodosState {
  todosNumber: number;
  todos: Todo[];
  listId: string;
  newTodo: Todo;
}

const initialState = (todos: Todo[], listId: string) =>
  ({
    listId,
    todos,
    todosNumber: todos.length,
    newTodo: {} as Todo
  } as TodosState);

export const useActions = (todos: Todo[], listId: string) => {
  const [state, dispatch] = useReducer(reducer, initialState(todos, listId));

  const actions = {
    handleChange: (index: number) => (e: GenericEvent) =>
      dispatch({ type: 'onChangeTodo', index, e }),
    handleChangeNewTodo: (e: GenericEvent) => dispatch({ type: 'onChangeNewTodo', e }),
    handleAddTodo: async () => {
      const newTodoComplete = { _id: mongoObjectId(), listId, title: state.newTodo.title };
      dispatch({ type: 'addTodo', newTodoComplete });
      await axios.post(`${process.env.NEXT_PUBLIC_APP_URI}/api/todos`, newTodoComplete);
    },
    handleRemoveTodo: async (_id: string, index: number) => {
      dispatch({ type: 'removeTodo', index });
      await axios.delete(`${process.env.NEXT_PUBLIC_APP_URI}/api/todos?listId=${_id}`);
    },
    handleUpdateTodo: async (t: Todo) => {
      await axios.put(`${process.env.NEXT_PUBLIC_APP_URI}/api/todos`, t);
    }
  };

  return { state, actions };
};
