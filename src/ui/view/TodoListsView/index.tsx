import Link from 'next/link';
import { useState } from 'react';
import { useTodoLists } from 'src/hooks/useTodoLists';
import { DragAndDropWrapper } from 'src/ui/common/dnd/DragAndDropWrapper';
import AddListSlideOver from 'src/ui/view/TodoListsView/components/AddListSlideOver';
import { ListDemo } from 'src/ui/view/TodoListsView/components/ListDemo';
import { NewListButton } from 'src/ui/view/TodoListsView/components/NewListButton';

const TodoListsView = () => {
  const [open, setOpen] = useState(false);
  const { todoLists, updateTodoListsOrder, handleAddTodoList } = useTodoLists();

  return (
    <>
      <header className="mx-auto my-0 mt-2.5 flex max-w-3xl flex-row items-center border-b-2 px-6 py-2">
        <h1 className="text-xl font-semibold text-primary">Maitu</h1>
        <Link
          className="ml-auto mr-5 border-b-2 border-primary px-3 py-0.5 text-base text-primary"
          href="/map"
        >
          Map
        </Link>
      </header>
      <div className="mx-auto mb-60 mt-0 max-w-2xl p-5">
        <DragAndDropWrapper onDragEnd={updateTodoListsOrder}>
          {todoLists.map((list) => (
            <ListDemo key={list.id} todoList={list} />
          ))}
        </DragAndDropWrapper>
        <NewListButton
          onClick={() => {
            setOpen(true);
          }}
        />
      </div>

      <AddListSlideOver
        title="Add List"
        open={open}
        setOpen={setOpen}
        handleAddTodoList={handleAddTodoList}
      />
    </>
  );
};

export default TodoListsView;
