import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ProjectState, Widget, SyllabusSection, WidgetType } from '@/types/canvas';

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
  isAuthenticated: boolean;
  isAuthChecking: boolean;
  setIsAuthenticated: (auth: boolean) => void;
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
  (set, get) => ({
    isExporting: false,
    setIsExporting: (isExporting) => set({ isExporting }),

    // Sync State
    isAuthenticated: false,
    isAuthChecking: true, // Start assuming we need to check
    setIsAuthenticated: (auth) => set({ isAuthenticated: auth }),
    isSyncing: false,
    lastSyncedAt: null,
    syncError: null,

    saveCanvas: async () => {
      const state = get();

      // Debounced Save Logic
      clearTimeout(saveTimeout);

      saveTimeout = setTimeout(async () => {
        set({ isSyncing: true, syncError: null });
        try {
          const dataToSave = {
            project: state.project,
            syllabus_sections: state.syllabus_sections,
            meta: state.meta
          };

          // Send plain data, server handles encryption
          // Note: We don't have a persistent ID in project state yet? 
          // We should probably store the DB ID in state.meta or state.project if we want to update the same record.
          // For now, let's assume we want to CREATE or UPDATE based on some ID.
          // But wait, the previous code used `state.project.id` which wasn't defined in types?
          // Let's rely on the server creating one if missing, but we need to store it back!

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

          if (response.status === 401) {
            set({ isSyncing: false, isAuthenticated: false, syncError: 'Unauthorized. Please login.' });
            return;
          }

          if (!response.ok) throw new Error('Failed to save');

          const result = await response.json();

          // Update state with the returned ID so future saves update this record
          if (result.canvas && result.canvas.id) {
            set((prev) => ({
              meta: { ...prev.meta, dbId: result.canvas.id } as any,
              lastSyncedAt: new Date().toISOString(),
              isSyncing: false,
              isAuthenticated: true
            }));
          } else {
            set({ isSyncing: false, lastSyncedAt: new Date().toISOString(), isAuthenticated: true });
          }

        } catch (error) {
          console.error("Sync error:", error);
          set({ isSyncing: false, syncError: 'Failed to save to cloud.' });
        }
      }, 1000);
    },

    loadCanvas: async () => {
      set({ isSyncing: true, syncError: null, isAuthChecking: true });
      try {
        const response = await fetch(`/api/canvas/load`);
        if (!response.ok) {
          if (response.status === 401) {
            set({ isSyncing: false, isAuthenticated: false, isAuthChecking: false });
            return;
          }
          if (response.status === 404) {
            set({ isSyncing: false, isAuthenticated: true, isAuthChecking: false }); // Authenticated but no canvas yet
            return;
          }
          throw new Error('Failed to load');
        }

        const result = await response.json();
        if (!result.canvas) {
          set({ isSyncing: false, isAuthenticated: true, isAuthChecking: false });
          return;
        }

        // Server returns decrypted data in `data` field
        const loadedData = result.canvas.data;

        console.log("🔥 LOADED DATA FROM DB:", loadedData);

        // Merge loaded data into state
        // Ensure we update everything: meta, project info, sections
        const newSections = loadedData.syllabus_sections && Array.isArray(loadedData.syllabus_sections)
          ? loadedData.syllabus_sections
          : DEFAULT_SECTIONS;

        console.log("🔥 SETTING SECTIONS:", newSections);

        set({
          project: { ...loadedData.project, title: result.canvas.title || loadedData.project?.title || 'Untitled' },
          syllabus_sections: newSections,
          meta: {
            ...loadedData.meta,
            dbId: result.canvas.id
          },
          isSyncing: false,
          lastSyncedAt: result.canvas.updatedAt,
          isAuthenticated: true,
          isAuthChecking: false
        });

      } catch (error) {
        console.error("Load error:", error);
        // If error is generic, we might still be authenticated but failed to fetch data.
        // However, for safety, let's keep auth state as is but stop checking.
        set({ isSyncing: false, syncError: 'Failed to load from cloud.', isAuthChecking: false });
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

);
