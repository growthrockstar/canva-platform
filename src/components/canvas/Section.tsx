import React from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, CheckSquare, Square } from 'lucide-react';
import type { SyllabusSection } from '../../types/canvas';
import { useCanvasStore } from '../../store/useCanvasStore';
import { Button } from '../ui/Button';
import { WidgetRenderer } from './WidgetRenderer';
import { SortableWidget } from './SortableWidget';
import { cn } from '../../lib/utils';

interface SectionProps {
  section: SyllabusSection;
  index: number;
}

export const Section: React.FC<SectionProps> = ({ section, index }) => {
  const { addWidget, moveWidget, toggleSectionComplete } = useCanvasStore();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      moveWidget(section.id, active.id as string, over.id as string);
    }
  };

  return (
    <div className="mb-12 print:mb-8 print:break-inside-avoid">
      <div className="flex items-center justify-between mb-6 border-b border-[var(--color-primary)]/30 pb-2">
        <h2 className="text-2xl font-bold text-[var(--color-primary)] flex items-center gap-3">
          <span className="text-white/20 text-3xl print:text-black/50">0{index + 1}</span>
          {section.title}
        </h2>
        <Button
          variant="ghost"
          onClick={() => toggleSectionComplete(section.id)}
          className={cn("print:hidden", section.is_completed ? "text-[var(--color-primary)]" : "text-white/30")}
        >
          {section.is_completed ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
        </Button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={section.widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4 min-h-[100px] border border-dashed border-white/5 rounded-lg p-4 bg-white/[0.02]">
            {section.widgets.length === 0 && (
              <div className="text-center py-8 text-white/20 italic select-none">
                Arrastra bloques o agrega contenido aquí
              </div>
            )}
            {section.widgets.map((widget) => (
              <SortableWidget key={widget.id} id={widget.id}>
                <WidgetRenderer widget={widget} sectionId={section.id} />
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-4 flex gap-2 justify-center opacity-50 hover:opacity-100 transition-opacity print:hidden">
        <Button variant="secondary" size="sm" onClick={() => addWidget(section.id, 'text_block')}>
          <Plus className="w-4 h-4 mr-2" /> Texto
        </Button>
        <Button variant="secondary" size="sm" onClick={() => addWidget(section.id, 'accordion')}>
          <Plus className="w-4 h-4 mr-2" /> Deslizable
        </Button>
        <Button variant="secondary" size="sm" onClick={() => addWidget(section.id, 'table')}>
          <Plus className="w-4 h-4 mr-2" /> Tabla
        </Button>
        <Button variant="secondary" size="sm" onClick={() => addWidget(section.id, 'image_base64')}>
          <Plus className="w-4 h-4 mr-2" /> Imagen
        </Button>
        <Button variant="secondary" size="sm" onClick={() => addWidget(section.id, 'graph_plot')}>
          <Plus className="w-4 h-4 mr-2" /> Gráfico
        </Button>
      </div>
    </div>
  );
};
