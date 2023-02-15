import { useReducer } from 'react';
import reducer from '@/state/todos/useTodoReducer';
import { Todo } from '@/types/main';
import mongoObjectId from '@/lib/generateUniqueId';
import { GenericEvent } from '@/types/events';

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
      await fetch(`${process.env.NEXT_PUBLIC_APP_URI}/api/todos`, {
        method: 'POST',
        body: JSON.stringify(newTodoComplete)
      });
      dispatch({ type: 'addTodo', newTodoComplete });
    },
    handleRemoveTodo: async (_id: string, index: number) => {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URI}/api/todos`, {
        method: 'DELETE',
        body: JSON.stringify({ _id })
      });
      dispatch({ type: 'removeTodo', index });
    },
    handleUpdateTodo: async (t: Todo) => {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URI}/api/todos`, {
        method: 'PUT',
        body: JSON.stringify(t)
      });
    }
  };

  return { state, actions };
};
