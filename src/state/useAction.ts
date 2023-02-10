import {useReducer} from "react";
import reducer from "./useTodoReducer";

interface InitialState {
    _listId: number,
    todos: any[],
}

const initialState: InitialState = {
    _listId: 0,
    todos: [{id: 0, title: ''}],
};

export const useActions = () => {
    const [state, dispatch] = useReducer(reducer, initialState);

    const actions = {
        handleChange: (index: number) => (e: any) => dispatch({type: 'onChangeTodo', index, e}),
        handleAddTodo: () => dispatch({type: 'addTodo'}),
        handleRemoveTodo: (index: number) => () => dispatch({type: 'removeTodo', index}),
    }

    const re: { state: InitialState, actions: any } = {state, actions};

    return re;


}
