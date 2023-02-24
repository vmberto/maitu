import { TodoListsState } from '@/state/todo-lists/TodoListsProvider';

export default function reducer(state: TodoListsState, action: any) {
  switch (action.type) {
    case 'setTodoLists': {
      return {
        ...state,
        todoLists: action.todoLists
      };
    }
    case 'onAddTodoList': {
      const { todoLists } = state;
      const { newTodoList } = action;
      const todoListsCopy = [...todoLists];
      todoListsCopy.push(newTodoList);
      return {
        ...state,
        todoLists: todoListsCopy
      };
    }
    case 'onDeleteTodoList': {
      const { todoLists } = state;
      const { listId } = action;
      const todoListsCopy = [...todoLists].filter((tl) => tl._id !== listId);
      return {
        ...state,
        todoLists: todoListsCopy
      };
    }
    default: {
      return state;
    }
  }
}
