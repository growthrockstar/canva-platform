"use client";

import React, { useState } from "react";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { Button } from "@/components/ui/Button";
import { Share2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateSectionImage } from "@/lib/exportUtils";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const { syllabus_sections, setIsExporting } = useCanvasStore();
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    syllabus_sections[0]?.id || "",
  );
  const [message, setMessage] = useState(
    "¡Hola! Mira mi avance en el Growth Rockstar Canvas 🚀",
  );
  const [isSharing, setIsSharing] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    const section = syllabus_sections.find((s) => s.id === selectedSectionId);
    if (!section) return;

    setIsSharing(true);
    setIsExporting(true); // Enable export mode to clean up UI for image

    // Small delay to ensure render updates
    setTimeout(async () => {
      await generateSectionImage(section.id, section.title, message);
      setIsExporting(false);
      setIsSharing(false);
      // Optional: Close modal after share?
      // onClose();
    }, 500);
  };

  return (
    <div className="absolute w-[99vw] h-screen inset-0 z-[100]  flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl  bg-[#1e1911] border border-white/10 rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] font-title uppercase">
            Compartir Avance
          </h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section Selector */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3 uppercase tracking-wider">
              1. Selecciona la Sección
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {syllabus_sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setSelectedSectionId(section.id)}
                  className={cn(
                    "p-3 rounded-md text-sm font-medium transition-all text-left border",
                    selectedSectionId === section.id
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                      : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <span className="opacity-50 mr-2">0{index + 1}.</span>
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          {/* Message & Action */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-2/3">
              <label className="block text-sm font-medium text-white/70 mb-3 uppercase tracking-wider">
                2. Mensaje (Whatsapp)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-32 bg-black/20 border border-white/10 rounded-md p-3 text-white placeholder-white/30 focus:outline-none focus:border-[var(--color-primary)] resize-none"
                placeholder="Escribe tu mensaje aquí..."
              />
            </div>

            <div className="w-full md:w-1/3 flex flex-col justify-end">
              <Button
                variant="primary"
                size="lg"
                onClick={handleShare}
                disabled={isSharing}
                className="w-full h-32 flex flex-col gap-2 items-center justify-center text-lg shadow-lg hover:scale-[1.02] transition-transform"
              >
                {isSharing ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <Share2 className="w-8 h-8" />
                )}
                <span>Compartir</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
