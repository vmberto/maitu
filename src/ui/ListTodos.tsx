import {ArrowLeftIcon} from '@heroicons/react/24/solid';
import {useRouter} from "next/router";
import Input from "../components/Input";
import {useActions} from "../state/useAction";
import {KeyboardEventHandler, useEffect, useRef} from "react";

interface ListTodosProps {
}

const ListTodos = () => {
    const router = useRouter();

    const {
        actions,
        state,
    } = useActions();

    useEffect(() => {
        const {_listId} = state;
        document.getElementById(`${_listId}`)?.focus();
    }, [state.todos]);

    const handleClickScreen = () => actions.handleAddTodo();

    const handleKeyPress: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            actions.handleAddTodo();
        }
    }

    return (
        <div className="h-screen" onClick={handleClickScreen}>
            <div className="max-w-xl my-0 mx-auto p-5">
                <div className="flex items-center">
                    <ArrowLeftIcon className="cursor-pointer h-8 w-8 mr-5" onClick={() => router.push('..')}/>
                    <h1 className="text-4xl">Lista 1</h1>
                </div>

                <div id="Todos" className="mt-10">
                    {state.todos.map(((t, index) =>
                        <Input key={t.id} id={t.id} value={t.title}
                               onClick={(e => e.stopPropagation())}
                               onKeyDown={handleKeyPress}
                               onBlur={(e) => {
                                   if (t.title.length <= 0) {
                                       actions.handleRemoveTodo(index)();
                                   }
                               }}
                               onChange={actions.handleChange(index)}/>))}

                </div>
            </div>

        </div>
    )
}

export default ListTodos;
