import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { ProjectState, Widget, SyllabusSection, WidgetType } from '@/types/canvas';

const DEFAULT_SECTIONS: SyllabusSection[] = [
  { id: 'section_1', title: 'FUNDAMENTOS Y RETENCIÓN', is_completed: false, widgets: [] },
  { id: 'section_2', title: 'ADQUISICIÓN', is_completed: false, widgets: [] },
  { id: 'section_3', title: 'ACTIVACIÓN', is_completed: false, widgets: [] },
  { id: 'section_4', title: 'REVENUE & MONETIZACIÓN', is_completed: false, widgets: [] },
  { id: 'section_5', title: 'REFERRAL & LOOPS', is_completed: false, widgets: [] },
];

interface CanvasStore extends ProjectState {
  setProjectTitle: (title: string) => void;
  setStudentName: (name: string) => void;
  addWidget: (sectionId: string, type: WidgetType, parentId?: string) => void;
  updateWidget: (sectionId: string, widgetId: string, data: Partial<Widget>) => void;
  removeWidget: (sectionId: string, widgetId: string) => void;
  moveWidget: (sectionId: string, activeId: string, overId: string) => void;
  resetProject: () => void;
  loadProject: (state: ProjectState) => void;
  toggleSectionComplete: (sectionId: string) => void;
  isExporting: boolean;
  setIsExporting: (isExporting: boolean) => void;
  setGridColumns: (columns: 1 | 2 | 3) => void;
}

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set) => ({
      isExporting: false,
      setIsExporting: (isExporting) => set({ isExporting }),
      
      meta: {
        version: '1.0',
        last_modified: new Date().toISOString(),
        theme: 'rockstar-default',
        grid_columns: 1,
      },
      project: {
        title: 'Mi Estrategia de Crecimiento',
        student_name: 'Rockstar Student',
      },
      syllabus_sections: DEFAULT_SECTIONS,

      setGridColumns: (columns) =>
        set((state) => ({
          meta: { ...state.meta, grid_columns: columns, last_modified: new Date().toISOString() },
        })),

      setProjectTitle: (title) =>
        set((state) => ({
          project: { ...state.project, title },
          meta: { ...state.meta, last_modified: new Date().toISOString() },
        })),

      setStudentName: (name) =>
        set((state) => ({
          project: { ...state.project, student_name: name },
          meta: { ...state.meta, last_modified: new Date().toISOString() },
        })),

      addWidget: (sectionId, type, parentId) =>
        set((state) => {
          const newWidget: Widget = {
            id: uuidv4(),
            type,
            content: type === 'text_block' ? '<h3 class="text-xl font-medium mb-2 mt-1">Nuevo Título</h3><p>Escribe aquí tus ideas...</p>' : undefined,
            title: type === 'accordion' ? 'Nueva Hipótesis' : undefined,
            children: [],
            tableData: type === 'table' ? [['Métrica', 'Q1', 'Q2'], ['Retention', '20%', '25%']] : undefined,
            graphConfig: type === 'graph_plot' ? undefined : undefined,
          };

          const updateWidgets = (widgets: Widget[]): Widget[] => {
            if (!parentId) return [...widgets, newWidget];
            return widgets.map((w) => {
              if (w.id === parentId && w.children) {
                return { ...w, children: [...w.children, newWidget] };
              }
              if (w.children) {
                return { ...w, children: updateWidgets(w.children) };
              }
              return w;
            });
          };

          return {
            syllabus_sections: state.syllabus_sections.map((section) =>
              section.id === sectionId
                ? { ...section, widgets: parentId ? updateWidgets(section.widgets) : [...section.widgets, newWidget] }
                : section
            ),
            meta: { ...state.meta, last_modified: new Date().toISOString() },
          };
        }),

      updateWidget: (sectionId, widgetId, data) =>
        set((state) => {
          const updateRecursive = (widgets: Widget[]): Widget[] => {
            return widgets.map(w => {
              if (w.id === widgetId) {
                return { ...w, ...data };
              }
              if (w.children) {
                return { ...w, children: updateRecursive(w.children) };
              }
              return w;
            });
          };

          return {
            syllabus_sections: state.syllabus_sections.map(s =>
              s.id === sectionId ? { ...s, widgets: updateRecursive(s.widgets) } : s
            ),
            meta: { ...state.meta, last_modified: new Date().toISOString() },
          }
        }),

      removeWidget: (sectionId, widgetId) =>
        set((state) => {
          const removeRecursive = (widgets: Widget[]): Widget[] => {
            return widgets.filter(w => w.id !== widgetId).map(w => {
              if (w.children) {
                return { ...w, children: removeRecursive(w.children) };
              }
              return w;
            });
          };

          return {
            syllabus_sections: state.syllabus_sections.map(s =>
              s.id === sectionId ? { ...s, widgets: removeRecursive(s.widgets) } : s
            ),
            meta: { ...state.meta, last_modified: new Date().toISOString() },
          }
        }),

      moveWidget: (sectionId, activeId, overId) =>
        set((state) => {
          // Basic reordering implementation (flat list for now, nested reordering is complex)
          // Ideally we use @dnd-kit's arrayMove
          const section = state.syllabus_sections.find(s => s.id === sectionId);
          if (!section) return state;

          // Find indices
          const oldIndex = section.widgets.findIndex(w => w.id === activeId);
          const newIndex = section.widgets.findIndex(w => w.id === overId);

          if (oldIndex === -1 || newIndex === -1) return state;

          const newWidgets = [...section.widgets];
          const [movedItem] = newWidgets.splice(oldIndex, 1);
          newWidgets.splice(newIndex, 0, movedItem);

          return {
            syllabus_sections: state.syllabus_sections.map(s =>
              s.id === sectionId ? { ...s, widgets: newWidgets } : s
            ),
            meta: { ...state.meta, last_modified: new Date().toISOString() },
          }
        }),

      resetProject: () =>
        set({
          syllabus_sections: DEFAULT_SECTIONS,
          project: { title: 'Nuevo Proyecto', student_name: '' },
          meta: { version: '1.0', last_modified: new Date().toISOString(), theme: 'rockstar-default' },
        }),

      loadProject: (newState) => set(newState),

      toggleSectionComplete: (sectionId) =>
        set((state) => ({
          syllabus_sections: state.syllabus_sections.map((s) =>
            s.id === sectionId ? { ...s, is_completed: !s.is_completed } : s
          ),
          meta: { ...state.meta, last_modified: new Date().toISOString() },
        })),
    }),
    {
      name: 'growth-rockstar-canvas-storage',
    }
  )
);
