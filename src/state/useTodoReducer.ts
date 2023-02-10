export default function reducer(state: any, action: any) {
    switch (action.type) {
        case 'onChangeTodo': {
            const {todos} = state;
            const {index, e} = action;
            const todosCopy = [...todos];
            const {value} = e.target;
            todosCopy[index].title = value;
            return {
                ...state,
                todos: todosCopy,
            }
        }
        case 'addTodo': {
            const {todos} = state;
            const todosCopy = [...todos];
            todosCopy.push({id: ++state._listId, title: ''});
            return {
                ...state,
                todos: todosCopy,
            }
        }
        case 'removeTodo': {
            const {todos} = state;
            const {index} = action;
            const todosCopy = [...todos].filter((_, i) => i !== index);
            return {
                ...state,
                todos: todosCopy,
            }
        }

        default: {
            return state;
        }

    }
}
