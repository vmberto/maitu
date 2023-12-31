import React, {useEffect, useState} from 'react';
import SlideOver from 'src/ui/common/SlideOver';
import {Todo} from '../../../../../types/main';
import {CheckCircleIcon} from '@heroicons/react/24/solid';
import {PlayCircleIcon} from '@heroicons/react/24/outline';
import {HexColors} from 'src/lib/colors';
import {formatDate} from 'src/lib/functions';
import {useTodos} from 'src/hooks/useTodos';
import {Section, SectionSelect} from "src/ui/view/TodosView/components/SectionSelect";
import {DescriptionSection} from "src/ui/view/TodosView/components/sections/DescriptionSection";
import {InputSection} from "src/ui/view/TodosView/components/sections/InputSection";

type TodoDetailSlideOverProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    todoData: Todo;
};

export const TodoDetailSlideOver = ({todoData, setOpen, open}: TodoDetailSlideOverProps) => {
    const todoService = useTodos();
    const [selectedSections, setSection] = useState<Section[]>([]);

    useEffect(() => {
        if (todoData.description) {
            setSection([...selectedSections, Section.DESCRIPTION]);
        }

        if (todoData.location) {
            setSection([...selectedSections, Section.LOCATION]);
        }
    }, [])


    return (
        <SlideOver
            title={
                <>
                    {todoData?.completeDisabled ? (
                        <CheckCircleIcon className="inline h-6 w-6 mr-1 mb-1" color="#5aee5c"/>
                    ) : (
                        <PlayCircleIcon className="inline h-6 w-6 mr-1 mb-1" color={HexColors.get('primary')}/>
                    )}
                    <div className="inline">{todoData?.title}</div>
                    {todoData?.createdAt instanceof Date && (
                        <div className="flex flex-col gap-2.5 text-gray-500 text-sm mt-2">
                            {formatDate(todoData?.createdAt)}
                        </div>
                    )}
                </>
            }
            open={open}
            setOpen={setOpen}>
            {selectedSections.includes(Section.DESCRIPTION) &&
                <DescriptionSection todoData={todoData} todoService={todoService}/>}
            {selectedSections.includes(Section.LOCATION) &&
                <InputSection todoService={todoService} label="Location" propertyName="location"
                              todoData={todoData}/>}
            <SectionSelect selectedSections={selectedSections} setSection={setSection}/>
        </SlideOver>
    );
};
