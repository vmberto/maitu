'use client';

import React, { useEffect, useState } from 'react';

import { DescriptionSection } from '@/src/app/todos/components/TodoDetailSlideOver/components/DescriptionSection';
import { InputSection } from '@/src/app/todos/components/TodoDetailSlideOver/components/InputSection';
import { Section } from '@/src/app/todos/components/TodoDetailSlideOver/components/SectionSelect';
import { TodoDetailTitle } from '@/src/app/todos/components/TodoDetailSlideOver/components/TodoDetailTitle';
import { useTodos } from '@/src/app/todos/state/provider';
import SlideOver from '@/src/components/SlideOver';
import { useModals } from '@/src/providers/slideover.provider';
import type { Todo } from '@/types/main';

export const TodoDetailSlideOver = () => {
  const { handleUpdateTodo } = useTodos();
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

      {currentTodo && selectedSections.includes(Section.LOCATION) && (
        <InputSection
          todoData={currentTodo}
          updateTodoData={handleUpdateTodo}
          label="Location"
          propertyName="location"
        />
      )}
    </SlideOver>
  );
};
