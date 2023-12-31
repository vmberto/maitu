import {GenericEvent} from "../../../../../../types/events";
import React, {useState} from "react";

import {useTodos} from 'src/hooks/useTodos';
import {Todo} from "../../../../../../types/main";

type InputSectionProps = {
    label: string;
    propertyName: keyof Todo;
    todoService: ReturnType<typeof useTodos>;
    todoData: Todo;
}

export const InputSection = ({todoData, todoService, label, propertyName}: InputSectionProps) => {
    const [value, setValue] = useState();

    return (
        <div className="mb-3">
            <label className="block text-sm font-medium leading-6 text-gray-900">{label}</label>
            <input placeholder="Latitude, Longitude" className="rounded-md mb-2 border-2 outline-0 p-3 resize-none block w-full
                            relative
                            bg-transparent
                            overflow-auto
                            h-auto
                            text-base
                            focus:outline-none"
                   onBlur={todoService.updateTodoData({...todoData, [propertyName]: value})}
                   onChange={(e: GenericEvent) => setValue(e.target.value)}
                   value={value}
            />
        </div>
    );
};

