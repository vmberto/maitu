import { GenericEvent } from '@/types/events';
import { FC, useContext, useState } from 'react';
import { TodoListsContext } from '@/state/todo-lists/TodoListsProvider';
import { TodoList } from '@/types/main';
import { Input } from '@/components/Input';

interface ListDemoProps {
  _id: string;
  listTitle: string;
}
export const DeleteList: FC<ListDemoProps> = ({ _id, listTitle }) => {
  const [listTitleInput, setListTitleInput] = useState('');
  const { handleDeleteTodoList } = useContext(TodoListsContext);
  const handleInputChange = (e: GenericEvent) => {
    const { value } = e.target;
    setListTitleInput(value);
  };

  const deleteTodoList = (listId: string) => () => {
    if (listTitleInput === listTitle) {
      handleDeleteTodoList(listId);
    }
  };

  return (
    <div
      className="my-2.5
        transition-all border-red-400 border
         bg-white p-4 rounded-md font-semibold items-center
         ">
      <form onSubmit={deleteTodoList(_id)}>
        <Input
          label={
            <>
              Please type <span className="font-bold">{listTitle}</span> to confirm deletion.
            </>
          }
          value={listTitleInput}
          onChange={handleInputChange}
        />
        <button
          type="submit"
          disabled={listTitleInput !== listTitle}
          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 rounded-full w-full bg-red-500 text-white p-3">
          Delete
        </button>
      </form>
    </div>
  );
};
