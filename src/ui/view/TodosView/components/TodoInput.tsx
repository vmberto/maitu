import React, {
    DetailedHTMLProps,
    useEffect,
    useRef,
    TextareaHTMLAttributes,
    useState,
    forwardRef,
    ForwardedRef,
    useImperativeHandle
} from 'react';
import {GenericEvent} from '../../../../../types/events';
import {Todo} from '../../../../../types/main';
import {Menu} from '@headlessui/react';
import {EllipsisHorizontalCircleIcon} from '@heroicons/react/24/outline';
import {TodoDetailSlideOver} from 'src/ui/view/TodosView/components/TodoDetailSlideOver';

type ElProps<T, R> = DetailedHTMLProps<T, R>;

export interface TodoInputProps
    extends ElProps<TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement> {
    todoData?: Todo;
    handleCompleteTodo?: (t: Todo) => void;
}

const TodoInput = forwardRef(
    (
        {todoData, handleCompleteTodo, ...rest}: TodoInputProps,
        ref: ForwardedRef<HTMLTextAreaElement>
    ) => {
        const textareaRef = useRef({} as HTMLTextAreaElement);
        const [open, setOpen] = useState(false);

        useImperativeHandle(ref, () => textareaRef.current);

        useEffect(() => {
            textareaRef.current.style.height = '0px';
            const {scrollHeight} = textareaRef.current;
            textareaRef.current.style.height = scrollHeight + 'px';
        }, [rest.value]);

        const handleClickCompleteTodo = (e: GenericEvent) => {
            e.stopPropagation();
            if (todoData && handleCompleteTodo) {
                handleCompleteTodo(todoData);
            }
        };

        const handleClick = (e: GenericEvent) => {
            e.stopPropagation();
            setOpen(true);
        };

        return (
            <div className="flex items-center border-t-2">
                <div
                    onClick={handleClickCompleteTodo}
                    className="cursor-pointer relative
        transition-all border-primary border-2 mr-2
          p-3.5 rounded-full font-semibold items-center">
                    {todoData?.complete && (
                        <div className="absolute bg-primary h-5 w-5 rounded-full right-1 top-1"></div>
                    )}
                </div>
                <textarea
                    ref={textareaRef}
                    className="block
                    w-full
                    relative z-10
                    bg-transparent
                    overflow-hidden
                    resize-none
                    text-base
                    px-2 py-4
                    outline-0
                    focus:outline-none"
                    {...rest}></textarea>
                {todoData?.id && (
                    <>
                        <Menu as="div" className="relative inline-block text-left">
                            <Menu.Button
                                onClick={handleClick}
                                className="inline-flex w-full justify-center
                p-1 text-sm font-medium text-gray-700 betterhover:hover:bg-gray-200
                focus:ring-offset-2 focus:ring-offset-gray-200 rounded-full">
                                <EllipsisHorizontalCircleIcon className="h-6 w-6"/>
                            </Menu.Button>
                        </Menu>
                        <TodoDetailSlideOver todoData={todoData} open={open} setOpen={setOpen}/>
                    </>
                )}
            </div>
        );
    }
);

export default TodoInput;
