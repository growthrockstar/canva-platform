"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { cn } from "@/lib/utils";
import {
  RotateCcw,
  FileJson,
  Loader2,
  Maximize2,
  Columns,
  Rows,
  LogOut,
} from "lucide-react";
import { generateFullPDF } from "@/lib/exportUtils";
import { Button } from "@/components/ui/Button";

export const LeftSidebar: React.FC = () => {
  const router = useRouter();
  const {
    project,
    setProjectTitle,
    setStudentName,
    syllabus_sections,
    focusedSectionId,
    setFocusedSectionId,
    setIsExporting,
    resetProject,
    setGridColumns,
    meta,
    setIsAuthenticated,
  } = useCanvasStore();

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showQualityOptions, setShowQualityOptions] = useState(false);

  // PDF Export Logic
  const handlePDFExport = async (scale: number) => {
    setIsGeneratingPDF(true);
    setIsExporting(true);
    setShowQualityOptions(false); // Close menu
    setTimeout(async () => {
      await generateFullPDF(project.title, scale);
      setIsExporting(false);
      setIsGeneratingPDF(false);
    }, 1000);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsAuthenticated(false);
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <aside className="w-[320px] bg-[#f2f2f2] border-r font-title border-[#010101]/10 h-screen sticky top-0 flex flex-col p-6 hidden lg:flex font-sans overflow-y-auto custom-scrollbar">
      {/* Branding */}
      <div className="flex items-center gap-3 mb-10 shrink-0">
        <Image
          src="/ISOTIPO.png"
          height={30}
          width={30}
          alt="Growth Rockstar Logo"
          className="object-contain"
        />
        <div className="flex flex-col">
          <span className="font-bold text-[#010101] tracking-tight leading-none">
            GROWTH ROCKSTAR
          </span>
          <span className="text-[#010101] text-xs tracking-widest opacity-60">
            CANVAS
          </span>
        </div>
      </div>

      {/* Project Info */}
      <div className="space-y-6 mb-8 shrink-0">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-[#010101]/50 font-bold">
            Proyecto
          </label>
          <input
            id="tour-project-title"
            value={project.title}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="w-full bg-transparent text-xl font-bold text-[#010101] placeholder-[#010101]/30 focus:outline-none focus:ring-0 border-none p-0 font-title"
            placeholder="Nombre del Proyecto"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-[#010101]/50 font-bold">
            Estudiante
          </label>
          <input
            id="tour-student-name"
            value={project.student_name}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full bg-transparent text-sm text-[#010101] placeholder-[#010101]/30 focus:outline-none focus:ring-0 border-b border-[#010101]/10 pb-1"
            placeholder="Tu Nombre"
          />
        </div>
      </div>

      <div className="w-full h-px bg-[#010101]/5 mb-8 shrink-0" />

      {/* Navigation Controls */}
      <div className="space-y-6 flex-1 flex flex-col min-h-0">
        {/* View All Button */}
        <div id="tour-expand-view" className="shrink-0 space-y-2">
          <button
            onClick={() => setFocusedSectionId(null)}
            className={cn(
              "w-full flex items-center justify-start gap-3 p-3 rounded-lg transition-all duration-200 border",
              !focusedSectionId
                ? "bg-[#010101] text-white border-[#010101]"
                : "bg-white text-[#010101] border-[#010101]/10 hover:border-[#010101]/30",
            )}
          >
            <Maximize2 className="w-5 h-5" />
            <span className="font-medium text-sm">Ampliar Vista</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setGridColumns(1);
                setFocusedSectionId(null); // Switch to grid view usually implies leaving focused mode
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all",
                meta.grid_columns === 1
                  ? "bg-[#010101]/5 text-[#010101] border-[#010101]"
                  : "bg-white text-[#010101]/60 border-[#010101]/10 hover:border-[#010101]/30",
              )}
              title="1 Columna"
            >
              <Rows className="w-4 h-4" />
              <span>1 Col</span>
            </button>
            <button
              onClick={() => {
                setGridColumns(2);
                setFocusedSectionId(null);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all",
                meta.grid_columns === 2
                  ? "bg-[#010101]/5 text-[#010101] border-[#010101]"
                  : "bg-white text-[#010101]/60 border-[#010101]/10 hover:border-[#010101]/30",
              )}
              title="2 Columnas"
            >
              <Columns className="w-4 h-4" />
              <span>2 Cols</span>
            </button>
          </div>
        </div>

        {/* Sections Grid */}
        <div
          className="flex-1 overflow-y-auto px-1 custom-scrollbar min-h-[150px]"
          id="tour-section-grid"
        >
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#f2f2f2] z-10 py-1">
            <span className="text-[10px] uppercase tracking-widest text-[#010101]/50 font-bold">
              Secciones
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 pb-2">
            {syllabus_sections.map((section, index) => {
              const isCompleted = section.is_completed;
              const isFocused = focusedSectionId === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setFocusedSectionId(section.id)}
                  title={section.title}
                  className={cn(
                    "aspect-square cursor-pointer rounded-md flex items-center justify-center font-title font-bold text-lg transition-all duration-200 border",
                    isCompleted
                      ? "bg-[#eeff8d] text-[#010101] border-[#eeff8d]"
                      : "bg-white text-[#010101] border-[#010101]/10",
                    isFocused &&
                      !isCompleted &&
                      "ring-2 ring-[#010101] ring-offset-2",
                    isFocused &&
                      isCompleted &&
                      "ring-2 ring-[#010101] ring-offset-2",
                    !isCompleted && "hover:border-[#010101]/30",
                  )}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools */}
        <div
          className="pt-6 border-t border-[#010101]/10 space-y-3 shrink-0"
          id="tour-tools"
        >
          <span className="text-[10px] uppercase tracking-widest text-[#010101]/50 font-bold block mb-2">
            Herramientas
          </span>

          <div className="relative">
            <Button
              variant="primary"
              className="w-full justify-start bg-[#010101] text-white hover:bg-[#010101]/80"
              onClick={() => setShowQualityOptions(!showQualityOptions)}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <FileJson className="w-4 h-4 mr-2" />
              )}
              <span>Exportar PDF</span>
            </Button>

            {showQualityOptions && (
              <div className="absolute bottom-full left-0 w-full bg-white border border-[#010101]/10 rounded-lg shadow-xl mb-2 overflow-hidden z-20">
                <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-[#010101]/40 font-bold bg-[#f9f9f9] border-b border-[#010101]/5">
                  Calidad
                </div>
                <button
                  onClick={() => handlePDFExport(1)}
                  className="w-full text-left px-4 py-2 text-sm text-[#010101] hover:bg-[#f2f2f2] transition-colors"
                >
                  Baja (Rápida)
                </button>
                <button
                  onClick={() => handlePDFExport(2)}
                  className="w-full text-left px-4 py-2 text-sm text-[#010101] hover:bg-[#f2f2f2] transition-colors"
                >
                  Media (Estándar)
                </button>
                <button
                  onClick={() => handlePDFExport(3)}
                  className="w-full text-left px-4 py-2 text-sm font-bold text-[#010101] hover:bg-[#f2f2f2] transition-colors"
                >
                  Alta (HD)
                </button>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start text-[#010101]  hover:bg-[#eeff8d]/50"
            onClick={resetProject}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            <span>Reset</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start  hover:text-red-500 hover:bg-red-50 mt-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span>Cerrar Sesión</span>
          </Button>
        </div>
      </div>

      <div className="mt-8 text-[10px] text-[#010101]/30 shrink-0">
        &copy; {new Date().getFullYear()} Growth Rockstar
      </div>
    </aside>
  );
};
