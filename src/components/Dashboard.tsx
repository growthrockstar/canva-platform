import React from "react";
import { useCanvasStore } from "../store/useCanvasStore";
import { cn } from "../lib/utils";
import { CheckCircle2, Circle } from "lucide-react";

export const Dashboard: React.FC = () => {
  const { syllabus_sections } = useCanvasStore();

  return (
    <div className="w-full bg-[#1e1911] border-b border-white/5 py-4 px-6 overflow-x-auto">
      <div className="max-w-7xl mx-auto flex items-center justify-between min-w-[600px] gap-4">
        {syllabus_sections.map((section, index) => (
          <div key={section.id} className="flex items-center gap-3 flex-1">
            <div
              className={cn(
                "flex flex-col flex-1 relative group cursor-default transition-opacity",
                section.is_completed
                  ? "opacity-100"
                  : "opacity-50 hover:opacity-80",
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-bold uppercase tracking-wider truncate max-w-[120px]"
                  title={section.title}
                >
                  {index + 1}. {section.title}
                </span>
                {section.is_completed ? (
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)]" />
                ) : (
                  <Circle className="w-4 h-4 text-white/30" />
                )}
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    section.is_completed
                      ? "bg-[var(--color-primary)] w-full"
                      : "bg-white/20 w-0",
                  )}
                />
              </div>
            </div>
            {index < syllabus_sections.length - 1 && (
              <div className="h-8 w-px bg-white/5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
