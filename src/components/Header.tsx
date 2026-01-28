import React, { useRef } from 'react';
import { Download, Upload, RotateCcw, FileJson } from 'lucide-react';
import { useCanvasStore } from '../store/useCanvasStore';
import { Button } from './ui/Button';

export const Header: React.FC = () => {
  const { project, resetProject, loadProject, setProjectTitle, setStudentName } = useCanvasStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = () => {
    const state = useCanvasStore.getState();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${state.project.title.replace(/\s+/g, '_')}.gr`);
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
    event.target.value = '';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[var(--color-background)]/95 backdrop-blur px-6 py-4 flex items-center justify-between">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
           <span className="text-[var(--color-primary)] font-bold text-xl tracking-tighter">GROWTH ROCKSTAR</span>
           <span className="text-white/50 text-sm">CANVAS</span>
        </div>
        <input 
          value={project.title}
          onChange={(e) => setProjectTitle(e.target.value)}
          className="bg-transparent border-none text-[var(--color-text)] font-bold text-lg focus:outline-none focus:ring-0 p-0 placeholder-white/30"
          placeholder="Nombre del Proyecto"
        />
      </div>

      <div className="flex items-center gap-4">
        <input 
             value={project.student_name}
             onChange={(e) => setStudentName(e.target.value)}
             className="bg-transparent border-b border-white/20 text-right text-sm focus:outline-none focus:border-[var(--color-primary)] w-40"
             placeholder="Tu Nombre"
        />
        
        <div className="h-6 w-px bg-white/20 mx-2" />

        <Button variant="ghost" size="sm" onClick={resetProject} title="Limpiar Todo">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
        </Button>

        <Button variant="secondary" size="sm" onClick={handleDownload} title="Descargar .gr">
            <Download className="w-4 h-4 mr-2" />
            Guardar
        </Button>

        <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} title="Cargar .gr">
            <Upload className="w-4 h-4 mr-2" />
            Cargar
        </Button>
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".gr,.json" 
            onChange={handleUpload}
        />

        <Button variant="primary" size="sm" onClick={() => window.print()} title="Exportar PDF">
            <FileJson className="w-4 h-4 mr-2" />
            PDF
        </Button>
      </div>
    </header>
  );
};
