import Link from 'next/link';
import {ReactNode, useState} from 'react';
import {Menu} from '@headlessui/react';
import {EllipsisVerticalIcon} from '@heroicons/react/24/solid';
import {GenericEvent} from '../../../../../types/events';
import {TodoList} from '../../../../../types/main';
import {ListDetailSlideOver} from 'src/ui/view/TodoListsView/components/ListDetailSlideOver';

type ListDemoProps = {
    todoList: TodoList;
    actions?: ReactNode | undefined;
}

export const ListDemo = ({todoList}: ListDemoProps) => {
    const [open, setOpen] = useState(false);

    const handleClick = (e: GenericEvent) => {
        e.stopPropagation();
        setOpen(true);
    };

    return (
        <Link
            href={{
                pathname: '/todos',
                query: {listId: todoList.id}
            }}>
            <div
                className={`my-2.5
        transition-all cursor-pointer active:opacity-50
         border-l-detail border-${todoList.color}
         bg-white p-4 rounded-md font-semibold items-center
         flex align-middle betterhover:hover:border-l-detail-hover shadow-sm`}>
                <h1>{todoList.title}</h1>
                <div className="ml-auto">
                    <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button
                            onClick={handleClick}
                            className="inline-flex w-full justify-center
                p-1 text-sm font-medium text-gray-700 betterhover:hover:bg-gray-200
                focus:ring-offset-2 focus:ring-offset-gray-200 rounded-full">
                            <EllipsisVerticalIcon className="h-8 w-8"/>
                        </Menu.Button>
                    </Menu>
                </div>
            </div>
            <ListDetailSlideOver open={open} setOpen={setOpen} todoList={todoList}/>
        </Link>
    );
};
