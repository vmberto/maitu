import React, {ChangeEvent, useRef, useState} from 'react';
import {Todo} from 'types/main';

import {useTodos} from 'src/hooks/useTodos';

type DescriptionSectionProps = {
    todoService: ReturnType<typeof useTodos>;
    todoData: Todo;
}

export const DescriptionSection = ({todoData, todoService}: DescriptionSectionProps) => {
    const textareaRef = useRef({} as HTMLTextAreaElement);
    const [description, setDescription] = useState(todoData?.description || '');

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setDescription(event.target.value);
    };

    return (
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
                onBlur={todoService.updateTodoData({
                    ...todoData,
                    description
                })}
            />
        </div>
    );
};
