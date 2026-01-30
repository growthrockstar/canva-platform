"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Widget } from '@/types/canvas';
import { useCanvasStore } from '@/lib/store/useCanvasStore';
import { Button } from '@/components/ui/Button';
import { WidgetRenderer } from "../WidgetRenderer";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableWidget } from "../SortableWidget";
import { cn } from '@/lib/utils';
import { useDroppable } from "@dnd-kit/core";

interface AccordionBlockProps {
  widget: Widget;
  sectionId: string;
  onUpdate: (data: Partial<Widget>) => void;
}

export const AccordionBlock: React.FC<AccordionBlockProps> = ({
  widget,
  sectionId,
  onUpdate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { addWidget, isExporting } = useCanvasStore();
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `container-${widget.id}`,
    data: {
      type: 'container',
      parentId: widget.id
    }
  });

  const toggleOpen = () => setIsOpen(!isOpen);

  const shouldShow = isOpen || isExporting;

  return (
    <div
      className={cn(
        "border rounded transition-colors print:border-none print:overflow-visible",
        shouldShow
          ? "border-[var(--color-primary)] bg-black/20 overflow-visible"
          : "border-white/20 hover:border-white/40 overflow-hidden",
        isExporting && "overflow-visible" // Prevent clipping during export
      )}
    >
      <div
        className={cn(
          "flex items-center p-3 bg-white/5 cursor-pointer select-none print:hidden",
        )}
        onClick={toggleOpen}
      >
        <span className="mr-2 text-[var(--color-primary)]">
          {shouldShow ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </span>

        {isExporting ? (
          <span className="font-bold uppercase tracking-wide flex-1 text-[var(--color-text)]">
            {widget.title || "Título Deslizable"}
          </span>
        ) : (
          <input
            value={widget.title || "Título Deslizable"}
            onChange={(e) => onUpdate({ title: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent border-none focus:outline-none font-bold uppercase tracking-wide flex-1 text-[var(--color-text)]"
          />
        )}
      </div>
      {/* Print friendly title */}
      <div
        className={cn(
          "hidden font-bold uppercase tracking-wide text-[var(--color-primary)] mb-2 border-b border-gray-300 print:block",
        )}
      >
        {widget.title || "Título Deslizable"}
      </div>

      {(shouldShow || true) && (
        <div
          ref={setDroppableRef}
          className={cn(
            "pr-4 pl-6 pt-4 pb-4 border-t border-white/10 space-y-4 duration-200 print:block print:border-none print:p-0 min-h-[60px]", // Added min-h for drop target
            !isExporting && "animate-in slide-in-from-top-2",
            shouldShow ? "block" : "hidden print:block",
          )}
        >
          <SortableContext
            items={widget.children?.map((child) => child.id) || []}
            strategy={verticalListSortingStrategy}
          >
            {widget.children?.map((child) => (
              <SortableWidget key={child.id} id={child.id}>
                <div className="relative group/child pl-4 border-l-2 border-white/5 print:border-l-0 print:pl-0">
                  <WidgetRenderer
                    widget={child}
                    sectionId={sectionId}
                    parentId={widget.id}
                  />
                </div>
              </SortableWidget>
            ))}
          </SortableContext>

          <div
            className={cn(
              "flex gap-2 justify-center mt-4 pt-4 border-t border-white/5 border-dashed print:hidden",
              isExporting && "hidden",
            )}
          >
            <span className="text-xs text-white/30 uppercase tracking-widest my-auto mr-2">
              Agregar al deslizable:
            </span>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => addWidget(sectionId, "text_block", widget.id)}
            >
              Texto
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => addWidget(sectionId, "image_base64", widget.id)}
            >
              Imagen
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => addWidget(sectionId, "table", widget.id)}
            >
              Tabla
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
