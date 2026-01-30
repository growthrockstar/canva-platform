"use client";

import React, { useRef, useState } from "react";
import {
  Download,
  Upload,
  RotateCcw,
  FileJson,
  Loader2,
  LayoutGrid,
  Columns,
  Rows,
} from "lucide-react";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { Button } from "@/components/ui/Button";
import { generateFullPDF } from "@/lib/exportUtils";
import { cn } from "@/lib/utils";

export const Header: React.FC = () => {
  const {
    project,
    resetProject,
    loadProject,
    setProjectTitle,
    setStudentName,
    setIsExporting,
    meta,
    setGridColumns,
  } = useCanvasStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownload = () => {
    const state = useCanvasStore.getState();
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      `${state.project.title.replace(/\s+/g, "_")}.gr`,
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        // Basic validation could go here
        loadProject(json);
      } catch (error) {
        console.error("Invalid project file", error);
        alert("Error loading project file");
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = "";
  };

  const handlePDFExport = async () => {
    setIsGeneratingPDF(true);
    setIsExporting(true);
    // Wait for render
    setTimeout(async () => {
      await generateFullPDF(project.title);
      setIsExporting(false);
      setIsGeneratingPDF(false);
    }, 1000);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b font-sans border-white/10 bg-[var(--color-background)]/95 backdrop-blur px-6 py-4 flex items-center justify-between print:hidden gap-4">
      <div className="flex flex-col min-w-[200px]">
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-primary)] font-bold text-xl tracking-tighter">
            GROWTH ROCKSTAR
          </span>
          <span className="text-white/50 text-sm">CANVAS</span>
        </div>
        <input
          value={project.title}
          onChange={(e) => setProjectTitle(e.target.value)}
          className="bg-transparent border-none text-[var(--color-text)] font-bold text-lg focus:outline-none focus:ring-0 p-0 placeholder-white/30"
          placeholder="Nombre del Proyecto"
        />
      </div>

      <div className="flex items-center gap-2 lg:gap-4 flex-wrap justify-end">
        {/* View Options */}
        <div className="flex items-center bg-white/5 rounded-md p-1 border border-white/10">
          <button
            onClick={() => setGridColumns(1)}
            className={cn(
              "p-1.5 rounded transition-colors",
              !meta.grid_columns || meta.grid_columns === 1
                ? "bg-white/10 text-[var(--color-primary)]"
                : "text-white/40 hover:text-white",
            )}
            title="1 Columna"
          >
            <Rows className="w-4 h-4" />
          </button>
          <button
            onClick={() => setGridColumns(2)}
            className={cn(
              "p-1.5 rounded transition-colors",
              meta.grid_columns === 2
                ? "bg-white/10 text-[var(--color-primary)]"
                : "text-white/40 hover:text-white",
            )}
            title="2 Columnas"
          >
            <Columns className="w-4 h-4" />
          </button>
          <button
            onClick={() => setGridColumns(3)}
            className={cn(
              "p-1.5 rounded transition-colors",
              meta.grid_columns === 3
                ? "bg-white/10 text-[var(--color-primary)]"
                : "text-white/40 hover:text-white",
            )}
            title="3 Columnas"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        <input
          value={project.student_name}
          onChange={(e) => setStudentName(e.target.value)}
          className="bg-transparent border-b border-white/20 text-right text-sm focus:outline-none focus:border-[var(--color-primary)] w-32 lg:w-40 hidden md:block"
          placeholder="Tu Nombre"
        />

        <div className="h-6 w-px bg-white/20 mx-2 hidden md:block" />

        <Button
          variant="ghost"
          size="sm"
          onClick={resetProject}
          title="Limpiar Todo"
        >
          <RotateCcw className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Reset</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownload}
          title="Descargar .gr"
        >
          <Download className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Guardar</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          title="Cargar .gr"
        >
          <Upload className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Cargar</span>
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".gr,.json"
          onChange={handleUpload}
        />

        <Button
          variant="primary"
          size="sm"
          onClick={handlePDFExport}
          title="Exportar PDF"
          disabled={isGeneratingPDF}
        >
          {isGeneratingPDF ? (
            <Loader2 className="w-4 h-4 md:mr-2 animate-spin" />
          ) : (
            <FileJson className="w-4 h-4 md:mr-2" />
          )}
          <span className="hidden md:inline">PDF</span>
        </Button>
      </div>
    </header>
  );
};
