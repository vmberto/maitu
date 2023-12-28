import {useEffect, useState} from 'react';
import SlideOver from 'src/ui/common/SlideOver';
import {GenericEvent} from '../../../../../types/events';
import {DeleteList} from 'src/ui/view/TodoListsView/components/DeleteList';
import {TodoList} from '../../../../../types/main';
import {ColorPicker} from 'src/ui/common/ColorPicker';
import {useTodoLists} from 'src/hooks/useTodoLists';

interface ListDetailSlideOver {
    open: boolean;
    setOpen: (open: boolean) => void;
    todoList: TodoList;
}

export const ListDetailSlideOver = ({open, setOpen, todoList}: ListDetailSlideOver) => {
    const {handleUpdateTodoList} = useTodoLists();
    const [color, setColor] = useState(todoList.color);
    const [listTitle, setListTitle] = useState(todoList.title);
    const [definedListTitle, setDefinedListTitle] = useState(todoList.title);

    const handleInputChange = (e: GenericEvent) => {
        const {value} = e.target;
        setListTitle(value);
    };

    const handleDefineTitle = () => {
        if (listTitle) {
            setDefinedListTitle(listTitle);
        } else {
            setListTitle(todoList.title);
        }
    };

    useEffect(() => {
        (async () => {
            await handleUpdateTodoList(todoList.id, {title: definedListTitle, color} as TodoList);
        })();
    }, [color, definedListTitle]);

    return (
        <SlideOver
            title={
                <input
                    id="title-input"
                    maxLength={30}
                    tabIndex={-1}
                    defaultValue={listTitle}
                    className="focus:outline-0 w-full leading-7"
                    onChange={handleInputChange}
                    onBlur={handleDefineTitle}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleDefineTitle();
                        }
                    }}
                />
            }
            open={open}
            setOpen={setOpen}>
            <ColorPicker color={color} setColor={setColor}/>

            <DeleteList listTitle={todoList.title} id={todoList.id}/>
        </SlideOver>
    );
};
