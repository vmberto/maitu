'use client';

import { useState } from 'react';

import { AddListSlideOver } from '@/src/app/components/AddListSlideOver';
import { ListDemo } from '@/src/app/components/ListDemo';
import { ListDetailSlideOver } from '@/src/app/components/ListDetailSlideOver';
import { NewListButton } from '@/src/app/components/NewListButton';
import { useLists } from '@/src/app/provider';
import { DragAndDropWrapper } from '@/src/components/dnd/DragAndDropWrapper';

export const Lists = () => {
  const [open, setOpen] = useState(false);
  const { updateListsOrder, handleAddList, lists } = useLists();

  return (
    <div className="mx-auto mb-60 mt-0 max-w-xl p-5">
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
