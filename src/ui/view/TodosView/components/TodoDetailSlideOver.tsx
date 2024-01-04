import { PlayCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import React, { useEffect, useState } from 'react';
import { useTodos } from 'src/hooks/useTodos';
import { HexColors } from 'src/lib/colors';
import { formatDate } from 'src/lib/functions';
import SlideOver from 'src/ui/common/SlideOver';
import { DescriptionSection } from 'src/ui/view/TodosView/components/sections/DescriptionSection';
import { InputSection } from 'src/ui/view/TodosView/components/sections/InputSection';
import {
  Section,
  SectionSelect,
} from 'src/ui/view/TodosView/components/SectionSelect';

import { type Todo } from '../../../../../types/main';

interface TodoDetailSlideOverProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  todoData: Todo;
}

export const TodoDetailSlideOver = ({
  todoData,
  setOpen,
  open,
}: TodoDetailSlideOverProps) => {
  const todoService = useTodos();
  const [selectedSections, setSection] = useState<Section[]>([]);

  useEffect(() => {
    if (
      todoData.description &&
      !selectedSections.includes(Section.DESCRIPTION)
    ) {
      setSection((prevSections) => [...prevSections, Section.DESCRIPTION]);
    }

    if (todoData.location && !selectedSections.includes(Section.LOCATION)) {
      setSection((prevSections) => [...prevSections, Section.LOCATION]);
    }
  }, [todoData.description, todoData.location, selectedSections]);

  return (
    <SlideOver
      title={
        <>
          {todoData?.completeDisabled ? (
            <CheckCircleIcon
              className="mb-1 mr-1 inline h-6 w-6"
              color="#5aee5c"
            />
          ) : (
            <PlayCircleIcon
              className="mb-1 mr-1 inline h-6 w-6"
              color={HexColors.get('primary')}
            />
          )}
          <div className="inline">{todoData?.title}</div>
          {todoData?.createdAt instanceof Date && (
            <div className="mt-2 flex flex-col gap-2.5 text-sm text-gray-500">
              {formatDate(todoData?.createdAt)}
            </div>
          )}
        </>
      }
      open={open}
      setOpen={setOpen}
    >
      {selectedSections.includes(Section.DESCRIPTION) && (
        <DescriptionSection todoData={todoData} todoService={todoService} />
      )}
      {selectedSections.includes(Section.LOCATION) && (
        <InputSection
          todoService={todoService}
          label="Location"
          propertyName="location"
          todoData={todoData}
        />
      )}
      <SectionSelect
        selectedSections={selectedSections}
        setSection={setSection}
      />
    </SlideOver>
  );
};
