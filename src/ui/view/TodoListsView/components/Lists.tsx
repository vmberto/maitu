import { useContext, useState } from 'react';
import { TodoListsContext } from 'src/hooks/useTodoLists';
import { DragAndDropWrapper } from 'src/ui/common/dnd/DragAndDropWrapper';
import { AddListSlideOver } from 'src/ui/view/TodoListsView/components/AddListSlideOver';
import { ListDemo } from 'src/ui/view/TodoListsView/components/ListDemo';
import { ListDetailSlideOver } from 'src/ui/view/TodoListsView/components/ListDetailSlideOver';
import { NewListButton } from 'src/ui/view/TodoListsView/components/NewListButton';

export const Lists = () => {
  const [open, setOpen] = useState(false);
  const { updateTodoListsOrder, handleAddTodoList, todoLists } =
    useContext(TodoListsContext);

  return (
    <div className="mx-auto mb-60 mt-0 max-w-2xl p-5">
      <DragAndDropWrapper onDragEnd={updateTodoListsOrder}>
        {todoLists.map((list) => (
          <ListDemo key={list._id} todoList={list} />
        ))}
      </DragAndDropWrapper>

      <NewListButton
        onClick={() => {
          setOpen(true);
        }}
      />

      <ListDetailSlideOver />

      <AddListSlideOver
        open={open}
        setOpen={setOpen}
        handleAddTodoList={handleAddTodoList}
      />
    </div>
  );
};
