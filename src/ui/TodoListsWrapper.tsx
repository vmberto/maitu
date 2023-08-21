import { FC, useState } from 'react';
import { ListDemo } from 'src/components/ListDemo';
import AddListSlideOver from 'src/ui/AddListSlideOver';
import SlideOver from 'src/components/SlideOver';
import { useTodoLists } from 'src/state/todo-lists/useTodoLists';

const TodoListsWrapper: FC = () => {
  const [open, setOpen] = useState(false);
  const { todoLists, handleAddTodoList } = useTodoLists();

  console.log(todoLists);
  return (
    <>
      <header className="flex flex-row max-w-3xl my-0 mx-auto py-2 px-6 mt-2.5 border-b-2 items-center">
        <h1 className="text-primary text-xl font-semibold">Maitu</h1>
        <button
          className="ml-auto border-2 border-primary text-primary rounded-full px-3 text-base py-0.5"
          onClick={() => setOpen(true)}>
          Add List +
        </button>
      </header>
      <div className="max-w-2xl mt-0 mb-60 mx-auto p-5">
        {todoLists.map((list) => (
          <ListDemo key={list.id} todoList={list} />
        ))}
      </div>
      <SlideOver title="Adicionar Lista" open={open} setOpen={setOpen}>
        <AddListSlideOver setOpen={setOpen} handleAddTodoList={handleAddTodoList} />
      </SlideOver>
    </>
  );
};

export default TodoListsWrapper;
