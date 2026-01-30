import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { ProjectState, Widget, SyllabusSection, WidgetType } from '@/types/canvas';
import { encryptData, decryptData } from '@/lib/crypto';

// Debounce helper
const debounce = (fn: Function, ms: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

const DEFAULT_SECTIONS: SyllabusSection[] = [];

// Module-level timeout for debouncing save
let saveTimeout: ReturnType<typeof setTimeout>;

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

  // Sync & Security
  encryptionPassword: string | null;
  setEncryptionPassword: (password: string) => void;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncError: string | null;
  saveCanvas: () => Promise<void>;
  loadCanvas: () => Promise<void>;
  forcePush: () => Promise<void>; // Force push local state to server

  // Tour
  runTour: boolean;
  setRunTour: (run: boolean) => void;

  // Sections
  fetchSections: () => Promise<void>;
}

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set, get) => ({
      isExporting: false,
      setIsExporting: (isExporting) => set({ isExporting }),

      // Sync State
      encryptionPassword: null,
      isSyncing: false,
      lastSyncedAt: null,
      syncError: null,

      setEncryptionPassword: (password) => set({ encryptionPassword: password }),

      saveCanvas: async () => {
        const state = get();
        const password = state.encryptionPassword;
        if (!password) return; // Cannot save without password

        // Debounced Save Logic
        clearTimeout(saveTimeout);

        saveTimeout = setTimeout(async () => {
          set({ isSyncing: true, syncError: null });
          try {
            const dataToEncrypt = {
              project: state.project,
              syllabus_sections: state.syllabus_sections,
              meta: state.meta
            };

            // Encrypt
            const encrypted = await encryptData(dataToEncrypt, password);
            const canvasId = state.project.id || 'default-canvas';
            const response = await fetch('/api/canvas/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                canvasId,
                data: encrypted.ciphertext,
                iv: encrypted.iv,
                salt: encrypted.salt
              })
            });

            if (!response.ok) throw new Error('Failed to save');

            set({ isSyncing: false, lastSyncedAt: new Date().toISOString() });
          } catch (error) {
            console.error("Sync error:", error);
            set({ isSyncing: false, syncError: 'Failed to save to cloud.' });
          }
        }, 1000);
      },

      loadCanvas: async () => {
        const state = get();
        if (!state.encryptionPassword) return;

        set({ isSyncing: true, syncError: null });
        try {
          const response = await fetch(`/api/canvas/load`);
          if (!response.ok) {
            if (response.status === 404) {
              set({ isSyncing: false });
              return;
            }
            throw new Error('Failed to load');
          }

          const data = await response.json();
          if (!data.canvas) {
            set({ isSyncing: false });
            return;
          }

          const decryptedState = await decryptData(data.canvas.data, data.canvas.iv, data.canvas.salt, state.encryptionPassword);

          set({
            project: decryptedState.project,
            syllabus_sections: decryptedState.syllabus_sections,
            meta: decryptedState.meta,
            isSyncing: false,
            lastSyncedAt: data.canvas.updatedAt
          });

        } catch (error) {
          console.error("Load error:", error);
          set({ isSyncing: false, syncError: 'Failed to load/decrypt from cloud.' });
        }
      },

      forcePush: async () => {
        await get().saveCanvas();
      },

      // Tour State
      runTour: true,
      setRunTour: (run) => set({ runTour: run }),

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

      setProjectTitle: (title) => {
        set((state) => ({
          project: { ...state.project, title },
          meta: { ...state.meta, last_modified: new Date().toISOString() },
        }));
        get().saveCanvas();
      },

      setStudentName: (name) => {
        set((state) => ({
          project: { ...state.project, student_name: name },
          meta: { ...state.meta, last_modified: new Date().toISOString() },
        }));
        get().saveCanvas();
      },

      addWidget: (sectionId, type, parentId) => {
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
        });
        get().saveCanvas();
      },

      updateWidget: (sectionId, widgetId, data) => {
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
        });
        get().saveCanvas();
      },

      removeWidget: (sectionId, widgetId) => {
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
        });
        get().saveCanvas();
      },

      moveWidget: (sectionId, activeId, overId) => {
        set((state) => {
          const section = state.syllabus_sections.find(s => s.id === sectionId);
          if (!section) return state;

          // Helper to find parent array and index of a widget
          const findWidgetParent = (widgets: Widget[], targetId: string): { parent: Widget[] | null, index: number, containerWidget?: Widget } => {
            for (let i = 0; i < widgets.length; i++) {
              if (widgets[i].id === targetId) {
                return { parent: widgets, index: i };
              }
              if (widgets[i].children) {
                const found = findWidgetParent(widgets[i].children!, targetId);
                if (found.parent) {
                  return { ...found, containerWidget: widgets[i] };
                }
              }
            }
            return { parent: null, index: -1 };
          };

          // Clone the section widgets to mutate
          // Clone the section widgets to mutate
          const newSectionWidgets = JSON.parse(JSON.stringify(section.widgets));

          const source = findWidgetParent(newSectionWidgets, activeId);

          let dest: { parent: Widget[] | null, index: number, containerWidget?: Widget };

          // Logic to handle dropping onto a container (e.g. empty accordion)
          if (overId.toString().startsWith('container-')) {
            const containerId = overId.toString().replace('container-', '');

            // Helper to find the widget that *is* the container
            const findContainerWidget = (widgets: Widget[]): Widget | null => {
              for (const w of widgets) {
                if (w.id === containerId) return w;
                if (w.children) {
                  const found = findContainerWidget(w.children);
                  if (found) return found;
                }
              }
              return null;
            };

            const container = findContainerWidget(newSectionWidgets);
            if (container) {
              if (!container.children) container.children = [];
              // Drop at the end of the list
              dest = { parent: container.children, index: container.children.length };
            } else {
              dest = { parent: null, index: -1 };
            }
          } else {
            // Normal drop onto another item
            dest = findWidgetParent(newSectionWidgets, overId);
          }

          if (!source.parent || !dest.parent) {
            // console.log("Source or dest not found", activeId, overId);
            return state;
          }

          const [movedItem] = source.parent.splice(source.index, 1);
          dest.parent.splice(dest.index, 0, movedItem);

          return {
            syllabus_sections: state.syllabus_sections.map(s =>
              s.id === sectionId ? { ...s, widgets: newSectionWidgets } : s
            ),
            meta: { ...state.meta, last_modified: new Date().toISOString() },
          }
        });
        get().saveCanvas();
      },

      resetProject: () => {
        set({
          syllabus_sections: DEFAULT_SECTIONS,
          project: { title: 'Nuevo Proyecto', student_name: '' },
          meta: { version: '1.0', last_modified: new Date().toISOString(), theme: 'rockstar-default' },
        });
        get().saveCanvas();
      },

      loadProject: (newState) => set(newState),


      toggleSectionComplete: (sectionId) => {
        set((state) => ({
          syllabus_sections: state.syllabus_sections.map((s) =>
            s.id === sectionId ? { ...s, is_completed: !s.is_completed } : s
          ),
          meta: { ...state.meta, last_modified: new Date().toISOString() },
        }));
        get().saveCanvas();
      },

      fetchSections: async () => {
        try {
          const res = await fetch('/api/sections');
          if (!res.ok) throw new Error('Failed to fetch sections');
          const data = await res.json();

          if (data.sections && Array.isArray(data.sections)) {
            set((state) => {
              const currentSections = state.syllabus_sections;

              const newSections = data.sections.map((dbSection: any) => {
                // Try to find existing section by title to keep widgets
                const existing = currentSections.find(s => s.title === dbSection.title);
                return {
                  id: dbSection.id, // Use DB ID
                  title: dbSection.title,
                  is_completed: existing ? existing.is_completed : false,
                  widgets: existing ? existing.widgets : []
                };
              });

              return {
                syllabus_sections: newSections,
                meta: { ...state.meta, last_modified: new Date().toISOString() }
              };
            });
          }
        } catch (error) {
          console.error("Error loading sections:", error);
        }
      },
    }),
    {
      name: 'growth-rockstar-canvas-storage',
    }
  )
);
