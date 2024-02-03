import { useState } from 'react';

import { AddListSlideOver } from '@/src/app/lists/components/AddListSlideOver';
import { ListDemo } from '@/src/app/lists/components/ListDemo';
import { ListDetailSlideOver } from '@/src/app/lists/components/ListDetailSlideOver';
import { NewListButton } from '@/src/app/lists/components/NewListButton';
import { useLists } from '@/src/app/lists/provider';
import { DragAndDropWrapper } from '@/src/components/dnd/DragAndDropWrapper';

export const Lists = () => {
  const [open, setOpen] = useState(false);
  const { updateListsOrder, handleAddList, lists } = useLists();

  return (
    <div className="mx-auto mb-60 mt-0 max-w-2xl p-5">
      <DragAndDropWrapper onDragEnd={updateListsOrder}>
        {lists.map((list) => (
          <ListDemo key={list._id} list={list} />
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
        handleAddList={handleAddList}
      />
    </div>
  );
};
