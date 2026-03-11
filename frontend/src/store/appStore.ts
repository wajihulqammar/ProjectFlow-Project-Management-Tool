import { create } from 'zustand';

interface AppStore {
  sidebarOpen: boolean;
  activeProjectId: string | null;
  taskModal: { open: boolean; taskId: string | null; projectId: string | null };
  createTaskModal: { open: boolean; projectId: string | null; column: string | null };
  createProjectModal: boolean;
  commandPaletteOpen: boolean;

  setSidebarOpen: (open: boolean) => void;
  setActiveProject: (id: string | null) => void;
  openTaskModal: (taskId: string, projectId?: string) => void;
  closeTaskModal: () => void;
  openCreateTask: (projectId: string, column?: string) => void;
  closeCreateTask: () => void;
  setCreateProjectModal: (open: boolean) => void;
  setCommandPalette: (open: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  sidebarOpen: true,
  activeProjectId: null,
  taskModal: { open: false, taskId: null, projectId: null },
  createTaskModal: { open: false, projectId: null, column: null },
  createProjectModal: false,
  commandPaletteOpen: false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveProject: (id) => set({ activeProjectId: id }),

  openTaskModal: (taskId, projectId) =>
    set({ taskModal: { open: true, taskId, projectId: projectId || null } }),
  closeTaskModal: () =>
    set({ taskModal: { open: false, taskId: null, projectId: null } }),

  openCreateTask: (projectId, column) =>
    set({ createTaskModal: { open: true, projectId, column: column || 'todo' } }),
  closeCreateTask: () =>
    set({ createTaskModal: { open: false, projectId: null, column: null } }),

  setCreateProjectModal: (open) => set({ createProjectModal: open }),
  setCommandPalette: (open) => set({ commandPaletteOpen: open }),
}));
