import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
}

export const SortableWidget: React.FC<SortableWidgetProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/sortable">
       <div 
          {...attributes} 
          {...listeners} 
          className="absolute -left-6 top-2 opacity-0 group-hover/sortable:opacity-100 cursor-grab active:cursor-grabbing text-white/20 hover:text-white/50 print:hidden z-10"
       >
           <GripVertical className="w-5 h-5" />
       </div>
       {children}
    </div>
  );
};
