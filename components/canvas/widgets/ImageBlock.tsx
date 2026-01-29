"use client";

import React, { useRef } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import type { Widget } from '@/types/canvas';
import { Button } from '@/components/ui/Button';

interface ImageBlockProps {
  widget: Widget;
  onUpdate: (data: Partial<Widget>) => void;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({ widget, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert("La imagen es muy pesada. Intenta con una menor a 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      onUpdate({ src: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  if (widget.src) {
    return (
      <div className="relative group rounded-md overflow-hidden border border-white/10 bg-black/20">
        <img src={widget.src} alt="Uploaded" className="max-w-full h-auto mx-auto" />
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onUpdate({ src: undefined })}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div 
        className="border-2 border-dashed border-white/10 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[var(--color-primary)]/50 hover:bg-white/5 transition-colors"
        onClick={() => fileInputRef.current?.click()}
    >
      <ImageIcon className="w-8 h-8 text-white/30 mb-2" />
      <span className="text-sm text-white/50">Click para subir imagen (max 500KB)</span>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleUpload} 
      />
    </div>
  );
};
