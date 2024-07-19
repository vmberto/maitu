import { Draggable } from '@hello-pangea/dnd';
import { type ReactNode } from 'react';

type DraggableWrapperProps = {
  draggableId: string;
  index: number;
  children: ReactNode;
  className?: string;
};

export const DraggableWrapper = ({
  draggableId,
  index,
  children,
  className,
}: DraggableWrapperProps) => (
  <Draggable
    draggableId={draggableId}
    disableInteractiveElementBlocking
    index={index}
  >
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
