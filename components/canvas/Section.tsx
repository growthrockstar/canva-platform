"use client";

import React, { useEffect, useState } from "react";
import {
  DndContext,
  pointerWithin,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, CheckSquare, Square, Share2, Loader2 } from "lucide-react";
import type { SyllabusSection } from "@/types/canvas";
import { useCanvasStore } from "@/public/lib/store/useCanvasStore";
import { Button } from "../ui/Button";
import { WidgetRenderer } from "./WidgetRenderer";
import { SortableWidget } from "./SortableWidget";
import { cn } from "@/public/lib/utils";
import { generateSectionImage } from "@/public/lib/exportUtils";

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
    widgetsLocked,
  } = useCanvasStore();

  const [fiveSecondsPassed, setFiveSecondsPassed] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Recursive helper to find a widget by ID
  const findWidget = React.useCallback(
    (widgets: any[], id: string): any | null => {
      for (const w of widgets) {
        if (w.id === id) return w;
        if (w.children) {
          const found = findWidget(w.children, id);
          if (found) return found;
        }
      }
      return null;
    },
    [],
  );

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      moveWidget(section.id, active.id as string, over.id as string);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      moveWidget(section.id, active.id as string, over.id as string);
    }
  };

  const handleShareImage = async () => {
    setIsGeneratingImage(true);
    setIsExporting(true);
    // Wait for React to render the "Export Mode" changes
    setTimeout(async () => {
      await generateSectionImage(section.id, section.title);
      setIsExporting(false);
      setIsGeneratingImage(false);
    }, 500);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setFiveSecondsPassed(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      id={section.id}
      className={cn(
        "print:mb-8 bg-gray-400/10 p-5 shadow print:break-inside-avoid relative",
        isExporting && " p-8 mb-0 ",
      )}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between  mb-3 border-b border-[var(--color-primary)]/30 pb-2">
        <div className="flex flex-col font-title">
          <h2 className="text-lg font-bold text-[var(--color-primary)] flex items-center gap-3">
            <span
              className={cn(
                "text-black/90 text-xl print:text-black/50",
                isExporting && "text-[var(--color-primary)] opacity-50",
              )}
            >
              0{index + 1}
            </span>
            {section.title}
          </h2>
        </div>

        {isGeneratingImage && (
          <img
            src="/IMAGOTIPO.png"
            alt="Growth Rockstar"
            width={200}
            className="opacity-80 mb-4"
          />
        )}

        <div className={cn("flex items-center gap-2", isExporting && "hidden")}>
          <Button
            id="tour-share-button"
            variant="ghost"
            size="sm"
            onClick={handleShareImage}
            disabled={isGeneratingImage}
            className="text-[var(--color-primary)] hover:text-[var(--color-primary)]/70"
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
                : "text-[var(--color-primary)]/30",
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

      <DndContext
        collisionDetection={pointerWithin}
        onDragStart={(e) => setActiveId(e.active.id as string)}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext
          items={section.widgets.map((w) => w.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            className={cn(
              "space-y-4 min-h-[20px] font-sans  ",
              isExporting && "border-none",
            )}
          >
            {section.widgets.length === 0 && !isExporting && (
              <div className="text-center py-4 text-sm text-black/20 italic select-none">
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
        <DragOverlay>
          {activeId ? (
            <div className="opacity-80">
              <WidgetRenderer
                widget={findWidget(section.widgets, activeId)!}
                sectionId={section.id}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {!widgetsLocked && (
        <>
          <p
            className={cn(
              "text-center text-xs animate-pulse font-bold",
              (isExporting || fiveSecondsPassed) && "hidden",
            )}
          >
            Selecciona una de estas opciones para agregar un bloque:
          </p>
          <div
            className={cn(
              " mt-4 flex flex-wrap gap-2 justify-center transition-opacity print:hidden",
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
            <Button
              variant="secondary"
              size="sm"
              onClick={() => addWidget(section.id, "link_block")}
            >
              <Plus className="w-4 h-4 mr-2" /> Enlace
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
