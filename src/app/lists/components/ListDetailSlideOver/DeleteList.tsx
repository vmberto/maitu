import { useContext, useState } from 'react';

import { ListsContext } from '@/src/app/lists/hooks/useLists';
import { Input } from '@/src/components/Input';
import type { FormEventHandler, InputChangeEventHandler } from '@/types/events';

type DeleteListProps = {
  id: string;
  listTitle: string;
};

export const DeleteList = ({ id, listTitle }: DeleteListProps) => {
  const [listTitleInput, setListTitleInput] = useState('');
  const { handleDeleteList } = useContext(ListsContext);

  const handleInputChange = (e: InputChangeEventHandler) => {
    const { value } = e.target;
    setListTitleInput(value);
  };

  const deleteList = (listId: string) => async (e: FormEventHandler) => {
    e.preventDefault();
    if (listTitleInput === listTitle) {
      await handleDeleteList(listId);
    }
  };

  return (
    <div
      className="my-5
        items-center rounded-md border
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
        <button
          type="submit"
          disabled={listTitleInput !== listTitle}
          className="w-full cursor-pointer rounded-full bg-danger p-3 text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Delete
        </button>
      </form>
    </div>
  );
};