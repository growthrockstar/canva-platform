import React from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { Section } from './canvas/Section';

export const Canvas: React.FC = () => {
  const { syllabus_sections } = useCanvasStore();

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 pb-32">
        {syllabus_sections.map((section, index) => (
            <Section key={section.id} section={section} index={index} />
        ))}
        
        <footer className="text-center text-white/20 mt-20 print:hidden">
            <p className="text-sm">Growth Rockstar Canvas - Local First Edition</p>
        </footer>
    </div>
  );
};
