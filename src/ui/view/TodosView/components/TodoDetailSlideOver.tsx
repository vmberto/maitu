import React, {ChangeEvent, useRef, useState} from 'react';
import SlideOver from 'src/ui/common/SlideOver';
import {Todo} from '../../../../../types/main';
import {CheckCircleIcon} from '@heroicons/react/24/solid';
import {PlayCircleIcon} from '@heroicons/react/24/outline';
import {HexColors} from 'src/utils/colors.utils';
import {formatDate} from 'src/utils/functions.utils';
import {useTodos} from 'src/hooks/useTodos';
import {GenericEvent} from "../../../../../types/events";

const minRows = 3;
const maxRows = 15;

type TodoDetailSlideOverProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    todoData: Todo;
};
export const TodoDetailSlideOver = ({todoData, setOpen, open}: TodoDetailSlideOverProps) => {
    const {updateTodoData} = useTodos();
    const textareaRef = useRef({} as HTMLTextAreaElement);
    const [description, setDescription] = useState(todoData?.description || '');
    const [location, setLocation] = useState(todoData?.location || '');

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        const textareaLineHeight = 24;

        const previousRows = event.target.rows;
        event.target.rows = minRows;
        const currentRows = Math.floor(event.target.scrollHeight / textareaLineHeight);
        if (currentRows === previousRows) {
            event.target.rows = currentRows;
        }
        if (currentRows >= maxRows) {
            event.target.rows = maxRows;
            event.target.scrollTop = event.target.scrollHeight;
        }

        setDescription(event.target.value);
    };

    return (
        <SlideOver
            title={
                <>
                    {todoData?.completeDisabled ? (
                        <CheckCircleIcon className="inline h-6 w-6 mr-1 mb-1" color="#5aee5c"/>
                    ) : (
                        <PlayCircleIcon className="inline h-6 w-6 mr-1 mb-1" color={HexColors.get('primary')}/>
                    )}
                    <div className="inline">{todoData?.title}</div>
                    {todoData?.createdAt instanceof Date && (
                        <div className="flex flex-col gap-2.5 text-gray-500 text-sm mt-2">
                            {formatDate(todoData?.createdAt)}
                        </div>
                    )}
                </>
            }
            open={open}
            setOpen={setOpen}>
            <div className="mb-3">
                <label className="block text-sm font-medium leading-6 text-gray-900">Description</label>
                <textarea
                    ref={textareaRef}
                    value={description}
                    placeholder="Set a description"
                    className="rounded-md border-2 outline-0 pt-2 pb-3 px-3 resize-none block w-full
                            relative
                            bg-transparent
                            overflow-auto
                            h-auto
                            text-base
                            focus:outline-none"
                    onChange={handleChange}
                    onBlur={updateTodoData({
                        ...todoData,
                        description
                    })}
                />
            </div>
            <div className="mb-3">
                <label className="block text-sm font-medium leading-6 text-gray-900">Location</label>
                <input placeholder="Latitude" className="rounded-md mb-2 border-2 outline-0 p-3 resize-none block w-full
                            relative
                            bg-transparent
                            overflow-auto
                            h-auto
                            text-base
                            focus:outline-none"
                       onBlur={updateTodoData({...todoData, location})}
                       onChange={(e: GenericEvent) => setLocation(e.target.value)}
                       value={location}
                />
            </div>
        </SlideOver>
    );
};
