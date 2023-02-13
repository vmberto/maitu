import mongoObjectId from '@/lib/generateUniqueId';
import { Todo } from '@/types/TodoList';

export default function reducer(state: any, action: any) {
  switch (action.type) {
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
      const { listId } = action;
      const newTodoCopy = { _id: mongoObjectId(), listId, title: state.newTodo.title };
      const todosCopy = [...todos];
      todosCopy.push(newTodoCopy);
      console.log(todosCopy);
      fetch(`http://localhost:3000/api/todos`, {
        method: 'POST',
        body: JSON.stringify(newTodoCopy)
      }).then(() => console.log(1));
      return {
        ...state,
        todosNumber: todosCopy.length,
        todos: todosCopy,
        newTodo: { _id: '', title: '', listId: '' } as Todo
      };
    }
    case 'isAddingTodo': {
      return {
        ...state,
        isAddingTodo: action.value
      };
    }
    case 'removeTodo': {
      const { todos } = state;
      const { index } = action;
      const todosCopy = [...todos].filter((_, i) => i !== index);
      return {
        ...state,
        todosNumber: todosCopy.length,
        todos: todosCopy
      };
    }

    default: {
      return state;
    }
  }
}
