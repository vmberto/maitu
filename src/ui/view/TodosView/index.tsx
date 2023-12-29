import {ArrowLeftIcon} from '@heroicons/react/24/solid';
import TodoInput from 'src/ui/view/TodosView/components/TodoInput';
import {FC, useRef} from 'react';
import Link from 'next/link';
import {useTodos} from 'src/hooks/useTodos';
import {FontColor, HexColors} from 'src/lib/colors';
import {GenericEvent} from "../../../../types/events";

const TodosView: FC = () => {
    const newTodoInputRef = useRef({} as HTMLTextAreaElement);
    const {
        todosToComplete,
        completedTodos,
        newTodo,
        selectedTodoList,
        clickScreenFocusHandler,
        handleKeyPressAdd,
        addTodo,
        handleChangeExistingTodo,
        handleChangeNewTodo,
        handleCompleteTodo,
        updateTodo,
        handleInputFocus,
        handleKeyPress,
        removeFocus,
        handleClickScreen
    } = useTodos(newTodoInputRef.current);

    return (
        <div className="relative">
            {clickScreenFocusHandler && (
                <div className="absolute w-full h-full" onClick={removeFocus}></div>
            )}
            <div className="min-h-screen" onClick={handleClickScreen}>
                <div className="max-w-xl my-0 mx-auto">
                    <div className="flex items-center py-2">
                        <Link className="pl-5 flex h-12" href=".."
                              onClick={(e: GenericEvent) => e.stopPropagation()}>
                            <ArrowLeftIcon
                                className="relative cursor-pointer w-6 mr-5"
                                color={HexColors.get(selectedTodoList.color)}
                            />
                        </Link>
                        <h1 className={`text-2xl font-bold pr-5 ${FontColor.get(selectedTodoList.color)}`}>
                            {selectedTodoList?.title}
                        </h1>
                    </div>
                    <div id="todos" className="mb-60 px-5 pb-5">
                        {todosToComplete.map((t) => (
                            <TodoInput
                                key={t.id}
                                id={t.id}
                                value={t.title}
                                todoData={t}
                                handleCompleteTodo={handleCompleteTodo}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={handleKeyPress}
                                onBlur={updateTodo(t)}
                                onFocus={handleInputFocus(t)}
                                onChange={handleChangeExistingTodo(t)}
                            />
                        ))}
                        <TodoInput
                            id="new-todo"
                            ref={newTodoInputRef}
                            value={newTodo.title}
                            onChange={handleChangeNewTodo}
                            onFocus={handleInputFocus(newTodo)}
                            onBlur={addTodo}
                            onKeyDown={handleKeyPressAdd}
                        />
                        <h1 className="text-sm border-t-2 pt-5 text-center font-light text-gray-500">
                            Click to add new Todo
                        </h1>
                    </div>
                    {!!completedTodos.length && (
                        <div id="complete-todos" className="px-5 pb-5">
                            <div className="flex align-middle text-lg font-semibold mt-5">
                                <h2>Complete Todos</h2>
                                <span className="text-sm font-semibold ml-auto">{completedTodos.length}</span>
                            </div>
                            <div id="Todos">
                                {completedTodos.map((t) => (
                                    <TodoInput key={t.id} id={t.id} todoData={t} value={t.title} disabled/>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TodosView;
