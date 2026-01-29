import React, { useState } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, CheckSquare, Square, Share2, Loader2 } from "lucide-react";
import type { SyllabusSection } from "../../types/canvas";
import { useCanvasStore } from "../../store/useCanvasStore";
import { Button } from "../ui/Button";
import { WidgetRenderer } from "./WidgetRenderer";
import { SortableWidget } from "./SortableWidget";
import { cn } from "../../lib/utils";
import { generateSectionImage } from "../../lib/exportUtils";

interface SectionProps {
  section: SyllabusSection;
  index: number;
}

export const Section: React.FC<SectionProps> = ({ section, index }) => {
  const {
    addWidget,
    moveWidget,
    toggleSectionComplete,
    isExporting,
    setIsExporting,
  } = useCanvasStore();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      moveWidget(section.id, active.id as string, over.id as string);
    }
  };

  const handleShareImage = async () => {
    setIsGeneratingImage(true);
    setIsExporting(true);
    // Wait for React to render the "Export Mode" changes (logo, expanded accordions)
    setTimeout(async () => {
      await generateSectionImage(section.id, section.title);
      setIsExporting(false);
      setIsGeneratingImage(false);
    }, 500); // 500ms delay to ensure render
  };

  return (
    <div
      id={section.id}
      className={cn(
        "mb-12 print:mb-8 print:break-inside-avoid relative",
        isExporting && "bg-[#282117] p-8 mb-0",
      )}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 border-b border-[var(--color-primary)]/30 pb-2">
        <div className="flex flex-col">
          {isGeneratingImage && (
            <img
              src="/LOGOGROWTH.png"
              alt="Growth Rockstar"
              className="w-auto w-auto mb-2 opacity-80"
            />
          )}
          <h2 className="text-2xl font-bold text-[var(--color-primary)] flex items-center gap-3">
            <span
              className={cn(
                "text-white/20 text-3xl print:text-black/50",
                isExporting && "text-[var(--color-primary)] opacity-50",
              )}
            >
              0{index + 1}
            </span>
            {section.title}
          </h2>
        </div>

        <div className={cn("flex items-center gap-2", isExporting && "hidden")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShareImage}
            disabled={isGeneratingImage}
            className="text-white/30 hover:text-[var(--color-primary)]"
            title="Compartir Imagen"
          >
            {isGeneratingImage ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => toggleSectionComplete(section.id)}
            className={cn(
              "print:hidden",
              section.is_completed
                ? "text-[var(--color-primary)]"
                : "text-white/30",
            )}
          >
            {section.is_completed ? (
              <CheckSquare className="w-6 h-6" />
            ) : (
              <Square className="w-6 h-6" />
            )}
          </Button>
        </div>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={section.widgets.map((w) => w.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            className={cn(
              "space-y-4 min-h-[100px] border border-dashed border-white/5 rounded-lg p-4 bg-white/[0.02]",
              isExporting && "border-none p-0",
            )}
          >
            {section.widgets.length === 0 && !isExporting && (
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

      <div
        className={cn(
          "mt-4 flex gap-2 justify-center opacity-50 hover:opacity-100 transition-opacity print:hidden",
          isExporting && "hidden",
        )}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={() => addWidget(section.id, "text_block")}
        >
          <Plus className="w-4 h-4 mr-2" /> Texto
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => addWidget(section.id, "accordion")}
        >
          <Plus className="w-4 h-4 mr-2" /> Deslizable
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => addWidget(section.id, "table")}
        >
          <Plus className="w-4 h-4 mr-2" /> Tabla
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => addWidget(section.id, "image_base64")}
        >
          <Plus className="w-4 h-4 mr-2" /> Imagen
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => addWidget(section.id, "graph_plot")}
        >
          <Plus className="w-4 h-4 mr-2" /> Gráfico
        </Button>
      </div>
    </div>
  );
};
