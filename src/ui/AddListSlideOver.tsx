import { FC, useContext, useState } from 'react';
import { GenericEvent } from 'src/types/events';
import { TodoList } from 'src/types/main';
import generateUniqueId from 'src/lib/generateUniqueId';
import { TodoListsContext } from 'src/state/todo-lists/TodoListsProvider';
import { Input } from 'src/components/Input';
import { ColorPicker, Colors } from 'src/components/ColorPicker';

interface AddListSlideOver {
  setOpen: (open: boolean) => void;
}

const AddListModal: FC<AddListSlideOver> = ({ setOpen }) => {
  const [listTitle, setListTitle] = useState('');
  const [color, setColor] = useState(Colors[0]);
  const { handleAddTodoList } = useContext(TodoListsContext);

  const handleInputChange = (e: GenericEvent) => {
    const { value } = e.target;
    setListTitle(value);
  };
  const handleSubmit = async (e: GenericEvent) => {
    e.preventDefault();
    if (listTitle.length > 0) {
      const newList: TodoList = {
        id: `tdl${generateUniqueId()}`,
        title: listTitle,
        color,
        dateAdded: new Date()
      };
      handleAddTodoList(newList);
      setOpen(false);
    }
  };

  return (
    <form id="addData-form" onSubmit={handleSubmit}>
      <div className="form-group mb-6">
        <Input value={listTitle} onChange={handleInputChange} label={<>Nome da Lista</>} />
        <ColorPicker color={color} setColor={setColor} />
      </div>
      <button
        type="submit"
        className={`
    px-6
    py-2.5
    bg-${color}
    text-white
    font-medium
    text-xs 
    leading-tight
    uppercase
    rounded
    shadow-md
    hover:bg-${color}-700 hover:shadow-lg
    focus:bg-${color}-700 focus:shadow-lg focus:outline-none focus:ring-0
    active:bg-${color}-800 active:shadow-lg
    transition
    duration-150
    ease-in-out`}>
        Submit
      </button>
    </form>
  );
};

export default AddListModal;
