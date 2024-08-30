import { useState } from 'react';

import { useLists } from '@/src/app/provider';
import { Button } from '@/src/components/Button/Button';
import { Input } from '@/src/components/Input/Input';
import { useSlideOver } from '@/src/providers/slideover.provider';
import type { FormEventHandler, InputChangeEventHandler } from '@/types/events';

type DeleteListProps = {
  id: string;
  listTitle: string;
};

export const DeleteList = ({ id, listTitle }: DeleteListProps) => {
  const [listTitleInput, setListTitleInput] = useState('');
  const { handleDeleteList } = useLists();
  const { handleCloseSlideOver } = useSlideOver();

  const handleInputChange = (e: InputChangeEventHandler) => {
    const { value } = e.target;
    setListTitleInput(value);
  };

  const deleteList = (listId: string) => async (e: FormEventHandler) => {
    e.preventDefault();
    if (listTitleInput === listTitle) {
      await handleDeleteList(listId);
      handleCloseSlideOver();
    }
  };

  return (
    <div
      className="items-center rounded-md border
         border-danger bg-white p-4 font-semibold transition-all"
    >
      <form onSubmit={deleteList(id)}>
        <Input
          label={
            <>
              Please type <span className="font-bold">{listTitle}</span> to
              confirm deletion.
            </>
          }
          value={listTitleInput}
          onChange={handleInputChange}
        />
        <Button
          type="submit"
          disabled={listTitleInput !== listTitle}
          color="danger"
          className="mt-4 w-full cursor-pointer rounded-full
          bg-danger p-3 text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Delete
        </Button>
      </form>
    </div>
  );
};
