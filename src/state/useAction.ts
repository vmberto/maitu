import { useReducer } from 'react';
import reducer from './useTodoReducer';
import { Todo } from '@/types/TodoList';
import mongoObjectId from '@/lib/generateUniqueId';

interface InitialState {
  todosNumber: number;
  todos: Todo[];
  listId: string;
  newTodo: Todo;
}

const initialState = (todos: Todo[], listId: string) => ({
  listId,
  todos,
  todosNumber: todos.length,
  newTodo: {} as Todo
});

export const useActions = (todos: Todo[], listId: string) => {
  const [state, dispatch] = useReducer(reducer, initialState(todos, listId));

  const actions = {
    handleChange: (index: number) => (e: any) => dispatch({ type: 'onChangeTodo', index, e }),
    handleChangeNewTodo: (e: any) => dispatch({ type: 'onChangeNewTodo', e }),
    handleAddTodo: async () => {
      const newTodoComplete = { _id: mongoObjectId(), listId, title: state.newTodo.title };
      await fetch(`http://localhost:3000/api/todos`, {
        method: 'POST',
        body: JSON.stringify(newTodoComplete)
      });
      dispatch({ type: 'addTodo', newTodoComplete });
    },
    handleRemoveTodo: async (_id: string, index: number) => {
      await fetch(`http://localhost:3000/api/todos`, {
        method: 'DELETE',
        body: JSON.stringify({ _id })
      });
      dispatch({ type: 'removeTodo', index });
    },
    handleUpdateTodo: async (t: Todo) => {
      await fetch(`http://localhost:3000/api/todos`, {
        method: 'PUT',
        body: JSON.stringify(t)
      });
    }
  };

  const re: { state: InitialState; actions: any } = { state, actions };

  return re;
};
