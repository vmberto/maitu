'use client';

import { useState } from 'react';

import { AddListSlideOver } from '@/src/app/(main)/components/AddListSlideOver';
import { ListDetailSlideOver } from '@/src/app/(main)/components/ListDetailSlideOver';
import { ListDemo } from '@/src/app/(main)/components/Lists/ListDemo';
import { NewListButton } from '@/src/app/(main)/components/NewListButton';
import { useLists } from '@/src/app/provider';
import { DragAndDropWrapper } from '@/src/components/DragAndDrop/DragAndDropWrapper';

export const Lists = () => {
  const [open, setOpen] = useState(false);
  const { updateListsOrder, handleAddList, lists } = useLists();

  return (
    <div className="mx-auto mb-60 mt-0 max-w-xl px-5 pb-5 pt-3">
      <DragAndDropWrapper onDragEnd={updateListsOrder}>
        {/* <div className="mb-4 flex"> */}
        {/*  <div className="rounded-3xl border-2 border-gray-200 px-4 py-1"> */}
        {/*    All */}
        {/*  </div> */}
        {/* </div> */}
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
