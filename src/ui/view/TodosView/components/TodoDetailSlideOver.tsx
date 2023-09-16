import React, { ChangeEvent, useRef, useState } from 'react';
import SlideOver from 'src/ui/common/SlideOver';
import { Todo } from 'src/types/main';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { PlayCircleIcon } from '@heroicons/react/24/outline';
import { HexColors } from 'src/utils/colorMappers';
import { formatDate } from 'src/utils/functions';

const minRows = 3;
const maxRows = 15;

type TodoDetailSlideOverProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  todoData: Todo;
};
export const TodoDetailSlideOver = ({ todoData, setOpen, open }: TodoDetailSlideOverProps) => {
  const textareaRef = useRef({} as HTMLTextAreaElement);
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState(3);

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
    setRows(currentRows < maxRows ? currentRows : maxRows);
  };

  return (
    <SlideOver
      title={
        <>
          {todoData?.completeDisabled ? (
            <CheckCircleIcon className="inline h-6 w-6 mr-1 mb-1" color="#5aee5c" />
          ) : (
            <PlayCircleIcon className="inline h-6 w-6 mr-1 mb-1" color={HexColors.get('primary')} />
          )}
          <h1 className="inline">{todoData?.title}</h1>
          {todoData?.createdAt instanceof Date && (
            <div className="flex flex-col gap-2.5 text-gray-500 text-sm mt-2">
              {formatDate(todoData?.createdAt)}
            </div>
          )}
        </>
      }
      open={open}
      setOpen={setOpen}>
      <div className="my-3">
        <textarea
          ref={textareaRef}
          rows={rows}
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
        />
      </div>
    </SlideOver>
  );
};
