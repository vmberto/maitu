'use client';

import React, { useEffect, useState } from 'react';

import { DescriptionSection } from '@/src/app/todos/components/TodoDetailSlideOver/components/DescriptionSection';
import { Section } from '@/src/app/todos/components/TodoDetailSlideOver/components/SectionSelect';
import { TodoDetailTitle } from '@/src/app/todos/components/TodoDetailSlideOver/components/TodoDetailTitle';
import { useTodosStore } from '@/src/app/todos/state/store';
import SlideOver from '@/src/components/SlideOver';
import { useModals } from '@/src/providers/slideover.provider';
import type { Todo } from '@/types/main';

export const TodoDetailSlideOver = () => {
  const { handleUpdateTodo } = useTodosStore();
  const {
    modalData: currentTodo,
    isOpen,
    handleCloseSlideOver,
  } = useModals<Todo>();
  const [selectedSections, setSection] = useState<Section[]>([]);

  useEffect(() => {
    if (
      currentTodo?.description &&
      !selectedSections.includes(Section.DESCRIPTION)
    ) {
      setSection((prevSections) => [...prevSections, Section.DESCRIPTION]);
    }

    if (currentTodo?.location && !selectedSections.includes(Section.LOCATION)) {
      setSection((prevSections) => [...prevSections, Section.LOCATION]);
    }
  }, [currentTodo?.description, currentTodo?.location, selectedSections]);

  return (
    <SlideOver
      title={<TodoDetailTitle currentTodo={currentTodo} />}
      open={isOpen}
      onClose={handleCloseSlideOver}
    >
      {currentTodo && (
        <DescriptionSection
          todoData={currentTodo}
          updateTodoData={handleUpdateTodo}
        />
      )}
    </SlideOver>
  );
};
