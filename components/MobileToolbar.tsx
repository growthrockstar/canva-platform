"use client";

import React, { useState } from "react";
import { useCanvasStore } from "@/public/lib/store/useCanvasStore";
import { cn } from "@/public/lib/utils";
import { Maximize2, FileJson, Loader2 } from "lucide-react";
import { generateFullPDF } from "@/public/lib/exportUtils";
import { Button } from "@/components/ui/Button";

export const MobileToolbar: React.FC = () => {
  const {
    syllabus_sections,
    focusedSectionId,
    setFocusedSectionId,
    project,
    setIsExporting,
  } = useCanvasStore();

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showQualityOptions, setShowQualityOptions] = useState(false);

  const handlePDFExport = async (scale: number) => {
    setIsGeneratingPDF(true);
    setIsExporting(true);
    setShowQualityOptions(false);
    setTimeout(async () => {
      await generateFullPDF(project.title, scale);
      setIsExporting(false);
      setIsGeneratingPDF(false);
    }, 1000);
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-[#010101]/10 z-50 flex items-center justify-between px-4 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {/* Sections Scroll (Horizontal) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[50%]">
        {syllabus_sections.map((section, index) => {
          const isCompleted = section.is_completed;
          const isFocused = focusedSectionId === section.id;

          return (
            <button
              key={section.id}
              onClick={() => setFocusedSectionId(section.id)}
              className={cn(
                "h-8 w-8 m-1 shrink-0 rounded-full flex items-center justify-center font-title font-bold text-sm border transition-all",
                isCompleted
                  ? "bg-[#eeff8d] text-[#010101] border-[#eeff8d]"
                  : "bg-white text-[#010101] border-[#010101]/10",
                isFocused &&
                  !isCompleted &&
                  "ring-2 ring-[#010101] ring-offset-2",
                isFocused &&
                  isCompleted &&
                  "ring-2 ring-[#010101] ring-offset-2",
              )}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFocusedSectionId(null)}
          title="Ampliar Vista"
          className="h-10 w-10 p-0 rounded-full border border-[#010101]/10"
        >
          <Maximize2 className="w-5 h-5" />
        </Button>

        <div className="relative">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowQualityOptions(!showQualityOptions)}
            disabled={isGeneratingPDF}
            className="h-10 w-10 p-0 rounded-full bg-[#010101] text-white hover:bg-[#010101]/80"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileJson className="w-4 h-4" />
            )}
          </Button>

          {showQualityOptions && (
            <div className="absolute bottom-full right-0 w-48 bg-white border border-[#010101]/10 rounded-lg shadow-xl mb-4 overflow-hidden z-20">
              <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-[#010101]/40 font-bold bg-[#f9f9f9] border-b border-[#010101]/5">
                Calidad PDF
              </div>
              <button
                onClick={() => handlePDFExport(1)}
                className="w-full text-left px-4 py-3 text-sm text-[#010101] hover:bg-[#f2f2f2] border-b border-[#010101]/5 last:border-0"
              >
                Baja (Rápida)
              </button>
              <button
                onClick={() => handlePDFExport(2)}
                className="w-full text-left px-4 py-3 text-sm text-[#010101] hover:bg-[#f2f2f2] border-b border-[#010101]/5 last:border-0"
              >
                Media (Estándar)
              </button>
              <button
                onClick={() => handlePDFExport(3)}
                className="w-full text-left px-4 py-3 text-sm font-bold text-[#010101] hover:bg-[#f2f2f2]"
              >
                Alta (HD)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
