import React, { useRef } from 'react';
import type { Widget } from '../../../types/canvas';
import { cn } from '../../../lib/utils';

interface TextBlockProps {
  widget: Widget;
  onUpdate: (data: Partial<Widget>) => void;
  isEditing?: boolean;
}

export const TextBlock: React.FC<TextBlockProps> = ({ widget, onUpdate }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleBlur = () => {
    if (contentRef.current) {
      onUpdate({ content: contentRef.current.innerHTML });
    }
  };

  return (
    <div className="group relative">
      <div
        ref={contentRef}
        className={cn(
            "min-h-[2em] p-2 outline-none focus:ring-1 focus:ring-[var(--color-primary)] rounded border border-transparent hover:border-white/10 transition-colors text-lg",
            "empty:before:content-[attr(data-placeholder)] empty:before:text-white/30"
        )}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        dangerouslySetInnerHTML={{ __html: widget.content || '' }}
        data-placeholder="Escribe aquí tus ideas..."
      />
    </div>
  );
};

