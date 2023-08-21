import { FC, useState } from 'react';
import { GenericEvent } from 'src/types/events';
import { TodoList } from 'src/types/main';
import { Input } from 'src/components/Input';
import { ColorPicker, Colors } from 'src/components/ColorPicker';
import { Button } from 'src/components/Button';

interface AddListSlideOver {
  setOpen: (open: boolean) => void;
  handleAddTodoList: (newTodoList: TodoList) => void;
}

const AddListModal: FC<AddListSlideOver> = ({ setOpen, handleAddTodoList }) => {
  const [listTitle, setListTitle] = useState('');
  const [color, setColor] = useState(Colors[0]);

  const handleInputChange = (e: GenericEvent) => {
    const { value } = e.target;
    setListTitle(value);
  };

  const handleSubmit = async (e: GenericEvent) => {
    e.preventDefault();
    if (listTitle.length > 0) {
      const newList = {
        title: listTitle,
        color,
        createdAt: new Date()
      } as TodoList;
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
      <Button type="submit" color={color} />
    </form>
  );
};

export default AddListModal;
