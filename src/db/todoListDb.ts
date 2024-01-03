import {Db} from 'src/db/index';
import {TodoList} from '../../types/main';


export const get = async () => {
    const todoLists = await Db.todoLists.toArray() || [];
    return [...todoLists]
        .sort((tlA, tlB) => tlA.index - tlB.index);
};

export const add = async (newTodoList: TodoList) => {
    await Db.todoLists.add(newTodoList);
};

export const update = async (listId: string, newTodoList: TodoList) => {
    await Db.todoLists.update(listId, {...newTodoList});
};

export const remove = async (listId: string) => {
    const thisListTodos = await Db.todos.where({listId}).toArray();
    await Db.todos.bulkDelete(thisListTodos.map((l) => l.id));
    await Db.todoLists.delete(listId);
};

export const updateOrder = async (initialIndex: number, destinationIndex: number) => {
    const items = await get();

    const [movedElement] = items.splice(initialIndex, 1);

    items.splice(destinationIndex, 0, movedElement);

    await Db.todoLists.bulkUpdate(items.map((item, index) => ({
        key: item.id,
        changes: {index}
    })));

}
