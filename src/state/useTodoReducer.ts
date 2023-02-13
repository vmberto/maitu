import mongoObjectId from '@/lib/generateUniqueId';

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
    case 'addTodo': {
      const { todos } = state;
      const todosCopy = [...todos];
      const newId = mongoObjectId();
      todosCopy.push({ _id: newId, title: '', listId: state.listId });
      return {
        ...state,
        lastAction: 'add/update',
        todosNumber: todosCopy.length,
        todos: todosCopy
      };
    }
    case 'removeTodo': {
      const { todos } = state;
      const { index } = action;
      const todosCopy = [...todos].filter((_, i) => i !== index);
      return {
        ...state,
        lastAction: 'remove',
        todosNumber: todosCopy.length,
        todos: todosCopy
      };
    }

    default: {
      return state;
    }
  }
}
