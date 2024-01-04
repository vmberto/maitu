import { type ReactNode } from 'react';
import {
  DragDropContext,
  Droppable,
  type DropResult,
  type ResponderProvided,
} from 'react-beautiful-dnd';

interface DragAndDropWrapperProps {
  onDragEnd: (result: DropResult, provided: ResponderProvided) => void;
  children: ReactNode;
}

export const DragAndDropWrapper = ({
  onDragEnd,
  children,
}: DragAndDropWrapperProps) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable-list">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
