import {useEffect, useRef, FC} from "react";
import React, {DetailedHTMLProps, TextareaHTMLAttributes} from 'react';

type ElProps<T, R> = DetailedHTMLProps<T, R>;

export interface TextareaProps extends ElProps<TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement> {
}

const Input: FC<TextareaProps> = (props) => {
    const textareaRef = useRef({} as HTMLTextAreaElement);

    useEffect(() => {
        textareaRef.current.style.height = "0px";
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = scrollHeight + "px";
    }, [props.value]);

    return (
        <div className="border-t-2">
                <textarea
                    ref={textareaRef}
                    className="block
                    w-full
                    bg-transparent
                    overflow-hidden
                    resize-none
                    border-gray-300
                    text-lg
                    px-2 py-4
                    outline-0
                    focus:outline-none"
                    {...props}
                ></textarea>
        </div>
    );
};

export default Input;
