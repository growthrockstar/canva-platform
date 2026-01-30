import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { ProjectState, Widget, SyllabusSection, WidgetType } from '@/types/canvas';
import { encryptData, decryptData } from '@/lib/crypto';
import { v4 as uuidv4 } from 'uuid';

// Debounce helper
const debounce = (fn: Function, ms: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

const DEFAULT_SECTIONS: SyllabusSection[] = [
  { id: 'section_1', title: 'FUNDAMENTOS Y RETENCIÓN', is_completed: false, widgets: [] },
  { id: 'section_2', title: 'ADQUISICIÓN', is_completed: false, widgets: [] },
  { id: 'section_3', title: 'ACTIVACIÓN', is_completed: false, widgets: [] },
  { id: 'section_4', title: 'REVENUE & MONETIZACIÓN', is_completed: false, widgets: [] },
  { id: 'section_5', title: 'REFERRAL & LOOPS', is_completed: false, widgets: [] },
];

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
  loadCanvas: (userId: string) => Promise<void>; // Requires userId to fetch
  forcePush: () => Promise<void>; // Force push local state to server
}

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set) => ({
      isExporting: false,
      setIsExporting: (isExporting) => set({ isExporting }),

      // Sync State
      encryptionPassword: null, // Don't persist this by default for higher security? Or maybe we should?
      // If using 'persist' middleware, it WILL be persisted if part of state.
      // For now, let's persist it for UX (Cold Start). 
      // Ideally, we'd use session storage or ask on load.
      isSyncing: false,
      lastSyncedAt: null,
      syncError: null,

      setEncryptionPassword: (password) => set({ encryptionPassword: password }),

      saveCanvas: async () => {
        const state = get();
        if (!state.encryptionPassword) return; // Cannot save without password

        // Debounced Save Logic could be handled here or by caller. 
        // For "auto saving al terminar de editar", we might want immediate or short debounce.

        set({ isSyncing: true, syncError: null });

        try {
          const dataToEncrypt = {
            project: state.project,
            syllabus_sections: state.syllabus_sections,
            meta: state.meta
          };

          // Encrypt
          const encrypted = await encryptData(dataToEncrypt, state.encryptionPassword);
          const canvasId = state.project.id || 'default-canvas'; // TODO: Manage IDs properly

          // Save to API
          // We need userId here. Ideally stored in user session or passed in. 
          // For this 'local-first' attempt, we might need a userId in the store or passed from a component.
          // Let's assume there's a user context we can grab, OR we store userId in the store too.
          // For now, let's mock userId or fail if missing.
          const userId = 'user-123'; // FIXME: Get real userId

          const response = await fetch('/api/canvas/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              canvasId,
              userId, // Sending userId is insecure if not verified by session, but matches current plan
              ...encrypted
            })
          });

          if (!response.ok) throw new Error('Failed to save');

          set({ isSyncing: false, lastSyncedAt: new Date().toISOString() });
        } catch (error) {
          console.error("Sync error:", error);
          set({ isSyncing: false, syncError: 'Failed to save to cloud.' });
        }
      },

      loadCanvas: async (userId: string) => {
        const state = get();
        if (!state.encryptionPassword) return;

        set({ isSyncing: true, syncError: null });
        try {
          const response = await fetch(`/api/canvas/load?userId=${userId}`);
          if (!response.ok) {
            if (response.status === 404) {
              // No remote data, that's fine, keep local
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

          // Decrypt
          // Check if remote is newer? 
          // For cold start, we usually want remote if local is stale or empty.
          // Let's just decrypt and load for now.
          const decryptedState = await decryptData(data.canvas.data, data.canvas.iv, data.canvas.salt, state.encryptionPassword);

          set({
            project: decryptedState.project,
            syllabus_sections: decryptedState.syllabus_sections, // Merge? No, overwrite for now.
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
    }),
    {
      name: 'growth-rockstar-canvas-storage',
    }
  )
);
