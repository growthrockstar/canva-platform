import React from 'react';
import { Trash2 } from 'lucide-react';
import type { Widget } from '../../types/canvas';
import { useCanvasStore } from '../../store/useCanvasStore';
import { TextBlock } from './widgets/TextBlock';
import { ImageBlock } from './widgets/ImageBlock';
import { TableBlock } from './widgets/TableBlock';
import { AccordionBlock } from './widgets/AccordionBlock';
import { Button } from '../ui/Button';

interface WidgetRendererProps {
  widget: Widget;
  sectionId: string;
  parentId?: string;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget, sectionId }) => {
  const { updateWidget, removeWidget } = useCanvasStore();

  const handleUpdate = (data: Partial<Widget>) => {
    updateWidget(sectionId, widget.id, data);
  };

  const renderContent = () => {
    switch (widget.type) {
      case 'text_block':
        return <TextBlock widget={widget} onUpdate={handleUpdate} />;
      case 'image_base64':
        return <ImageBlock widget={widget} onUpdate={handleUpdate} />;
      case 'table':
        return <TableBlock widget={widget} onUpdate={handleUpdate} />;
      case 'accordion':
        return <AccordionBlock widget={widget} sectionId={sectionId} onUpdate={handleUpdate} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative group/widget mb-4 last:mb-0">
      <div className="absolute -left-10 top-0 opacity-0 group-hover/widget:opacity-100 transition-opacity flex flex-col gap-1 print:hidden">
         <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
            onClick={() => removeWidget(sectionId, widget.id)}
            title="Eliminar widget"
         >
             <Trash2 className="w-4 h-4" />
         </Button>
      </div>
      {renderContent()}
    </div>
  );
};
