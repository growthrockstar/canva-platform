import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Widget } from '../../../types/canvas';
import { useCanvasStore } from '../../../store/useCanvasStore';
import { Button } from '../../ui/Button';
import { WidgetRenderer } from '../WidgetRenderer';
import { cn } from '../../../lib/utils';

interface AccordionBlockProps {
  widget: Widget;
  sectionId: string;
  onUpdate: (data: Partial<Widget>) => void;
}

export const AccordionBlock: React.FC<AccordionBlockProps> = ({ widget, sectionId, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { addWidget } = useCanvasStore();

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className={cn(
        "border rounded transition-colors overflow-hidden print:border-none print:overflow-visible",
        isOpen ? "border-[var(--color-primary)] bg-black/20" : "border-white/20 hover:border-white/40"
    )}>
      <div 
        className="flex items-center p-3 bg-white/5 cursor-pointer select-none print:hidden"
        onClick={toggleOpen}
      >
        <span className="mr-2 text-[var(--color-primary)]">
            {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </span>
        <input 
            value={widget.title || 'Título Deslizable'}
            onChange={(e) => onUpdate({ title: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent border-none focus:outline-none font-bold uppercase tracking-wide flex-1 text-[var(--color-text)]"
        />
      </div>
       {/* Print friendly title */}
       <div className="hidden print:block font-bold uppercase tracking-wide text-[var(--color-primary)] mb-2 border-b border-gray-300">
           {widget.title || 'Título Deslizable'}
       </div>

      {(isOpen || true) && ( // Always render content, hide with CSS if closed for animation, or conditional. For Print we need it visible.
        <div className={cn(
            "p-4 border-t border-white/10 space-y-4 animate-in slide-in-from-top-2 duration-200 print:block print:border-none print:p-0",
             isOpen ? "block" : "hidden print:block"
        )}>
           {widget.children?.map((child) => (
             <div key={child.id} className="relative group/child pl-4 border-l-2 border-white/5 print:border-l-0 print:pl-0">
                <WidgetRenderer widget={child} sectionId={sectionId} parentId={widget.id} />
             </div>
           ))}
           
           <div className="flex gap-2 justify-center mt-4 pt-4 border-t border-white/5 border-dashed print:hidden">
             <span className="text-xs text-white/30 uppercase tracking-widest my-auto mr-2">Agregar al deslizable:</span>
             <Button size="sm" variant="ghost" onClick={() => addWidget(sectionId, 'text_block', widget.id)}>Texto</Button>
             <Button size="sm" variant="ghost" onClick={() => addWidget(sectionId, 'image_base64', widget.id)}>Imagen</Button>
             <Button size="sm" variant="ghost" onClick={() => addWidget(sectionId, 'table', widget.id)}>Tabla</Button>
           </div>
        </div>
      )}
    </div>
  );
};

