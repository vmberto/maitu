'use client';

import React, { useEffect, useState } from 'react';

import { DescriptionSection } from '@/src/app/todos/components/TodoDetailSlideOver/components/DescriptionSection';
import { InputSection } from '@/src/app/todos/components/TodoDetailSlideOver/components/InputSection';
import {
  Section,
  SectionSelect,
} from '@/src/app/todos/components/TodoDetailSlideOver/components/SectionSelect';
import { TodoDetailTitle } from '@/src/app/todos/components/TodoDetailSlideOver/components/TodoDetailTitle';
import { useTodos } from '@/src/app/todos/provider';
import SlideOver from '@/src/components/SlideOver';
import { useModals } from '@/src/providers/slideover.provider';

export const TodoDetailSlideOver = () => {
  const { updateTodoData } = useTodos();
  const { modalData: currentTodo, handleCloseSlideOver } = useModals();
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
      open={!!currentTodo}
      onClose={handleCloseSlideOver}
    >
      {selectedSections.includes(Section.DESCRIPTION) && (
        <DescriptionSection
          todoData={currentTodo}
          updateTodoData={updateTodoData}
        />
      )}

      {selectedSections.includes(Section.LOCATION) && (
        <InputSection
          todoData={currentTodo}
          updateTodoData={updateTodoData}
          label="Location"
          propertyName="location"
        />
      )}

      <SectionSelect
        selectedSections={selectedSections}
        setSection={setSection}
      />
    </SlideOver>
  );
};
