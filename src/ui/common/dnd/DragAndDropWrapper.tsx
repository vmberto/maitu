import { type ReactNode } from 'react';
import type {
  DragStart,
  DropResult,
  ResponderProvided,
} from 'react-beautiful-dnd';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

interface DragAndDropWrapperProps {
  onDragStart?: (result: DragStart) => void;
  onDragEnd: (result: DropResult, provided: ResponderProvided) => void;
  children: ReactNode;
}

export const DragAndDropWrapper = ({
  onDragStart,
  onDragEnd,
  children,
}: DragAndDropWrapperProps) => {
  return (
    <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
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
