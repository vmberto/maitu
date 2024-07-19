import type {
  DragStart,
  DropResult,
  ResponderProvided,
} from '@hello-pangea/dnd';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { type ReactNode } from 'react';

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
          <div ref={provided.innerRef}>
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
