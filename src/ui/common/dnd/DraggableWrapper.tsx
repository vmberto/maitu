import { type ReactNode } from 'react';
import { Draggable } from 'react-beautiful-dnd';

interface DraggableWrapperProps {
  draggableId: string;
  index: number;
  children: ReactNode;
  className: string;
}

export const DraggableWrapper = ({
  draggableId,
  index,
  children,
  className,
}: DraggableWrapperProps) => (
  <Draggable draggableId={draggableId} index={index}>
    {(provided) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        style={provided.draggableProps.style}
        className={className}
      >
        {children}
      </div>
    )}
  </Draggable>
);
