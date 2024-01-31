import { PlayCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import React, { useContext, useEffect, useState } from 'react';

import { DescriptionSection } from '@/src/app/todos/components/sections/DescriptionSection';
import { InputSection } from '@/src/app/todos/components/sections/InputSection';
import {
  Section,
  SectionSelect,
} from '@/src/app/todos/components/sections/SectionSelect';
import { TodosContext } from '@/src/app/todos/hooks/useTodos';
import SlideOver from '@/src/components/SlideOver';
import { HexColors } from '@/src/lib/colors';
import { formatDate } from '@/src/lib/functions';

export const TodoDetailSlideOver = () => {
  const {
    isTodoDetailOpen,
    currentTodo,
    handleCloseSlideOver,
    updateTodoData,
  } = useContext(TodosContext);
  const [selectedSections, setSection] = useState<Section[]>([]);

  useEffect(() => {
    if (
      currentTodo.description &&
      !selectedSections.includes(Section.DESCRIPTION)
    ) {
      setSection((prevSections) => [...prevSections, Section.DESCRIPTION]);
    }

    if (currentTodo.location && !selectedSections.includes(Section.LOCATION)) {
      setSection((prevSections) => [...prevSections, Section.LOCATION]);
    }
  }, [currentTodo.description, currentTodo.location, selectedSections]);

  return (
    <SlideOver
      title={
        <>
          {currentTodo?.completeDisabled ? (
            <CheckCircleIcon
              className="mb-1 mr-1 inline size-6"
              color="#5aee5c"
            />
          ) : (
            <PlayCircleIcon
              className="mb-1 mr-1 inline size-6"
              color={HexColors.get('primary')}
            />
          )}
          <div className="inline">{currentTodo?.title}</div>
          {currentTodo?.createdAt && (
            <div className="mt-2 flex flex-col gap-2.5 text-sm text-gray-500">
              {formatDate(currentTodo?.createdAt)}
            </div>
          )}
        </>
      }
      open={isTodoDetailOpen}
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
