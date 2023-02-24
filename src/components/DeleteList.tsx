import { GenericEvent } from '@/types/events';
import { FC, useContext, useState } from 'react';
import { TodoListsContext } from '@/state/todo-lists/TodoListsProvider';
import { TodoList } from '@/types/main';

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
        <div className="form-group mb-4">
          <label
            htmlFor="firstName"
            className="form-label inline-block mb-2 font-light text-gray-700">
            Please type <span className="font-bold">{listTitle}</span> to confirm deletion.
          </label>
          <input
            type="text"
            className="form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
            value={listTitleInput}
            onChange={handleInputChange}
            id="firstName"
          />
        </div>
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
