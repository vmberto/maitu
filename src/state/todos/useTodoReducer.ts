import { Todo } from '@/types/main';
import { TodosState } from '@/state/todos/TodosProvider';

export default function reducer(state: TodosState, action: any) {
  switch (action.type) {
    case 'setTodos': {
      return {
        ...state,
        todos: action.todos,
        listTitle: action.listTitle
      };
    }
    case 'onChangeTodo': {
      const { todos } = state;
      const { index, e } = action;
      const todosCopy = [...todos];
      const { value } = e.target;
      todosCopy[index].title = value;
      return {
        ...state,
        todos: todosCopy
      };
    }
    case 'onChangeNewTodo': {
      const { e } = action;
      const newTodoCopy = { ...state.newTodo };
      const { value } = e.target;
      newTodoCopy.title = value;
      return {
        ...state,
        newTodo: newTodoCopy
      };
    }
    case 'addTodo': {
      const { todos } = state;
      const todosCopy = [...todos];
      todosCopy.push(action.addedTodo);
      return {
        ...state,
        todos: todosCopy,
        newTodo: { _id: '', title: '', listId: '' } as Todo
      };
    }
    case 'removeTodo': {
      const { todos } = state;
      const { index } = action;
      const todosCopy = [...todos].filter((_, i) => i !== index);
      return {
        ...state,
        todos: todosCopy
      };
    }

    default: {
      return state;
    }
  }
}
