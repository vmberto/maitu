import * as TodoListDb from 'src/db/todoListDb';
import {TodoList} from '../../types/main';
import {useLiveQuery} from 'dexie-react-hooks';
import {useState} from 'react';
import {DropResult} from "react-beautiful-dnd";

export const useTodoLists = () => {
    const [todoLists, setTodoLists] = useState<TodoList[]>([] as TodoList[]);

    useLiveQuery(async () => {
        setTodoLists(await TodoListDb.get());
    }, []);

    const updateTodoListsOrder = async (result: DropResult) => {
        if (!result.destination) return;

        await TodoListDb.updateOrder(result.source.index, result.destination.index)
    };

    const handleAddTodoList = async (newTodoList: TodoList) => {
        await TodoListDb.add(newTodoList);
    };

    const handleUpdateTodoList = async (listId: string, updatedTodoList: TodoList) => {
        await TodoListDb.update(listId, updatedTodoList);
    };

    const handleDeleteTodoList = async (listId: string) => {
        await TodoListDb.remove(listId);
    };

    return {todoLists, updateTodoListsOrder, handleAddTodoList, handleDeleteTodoList, handleUpdateTodoList};
};
