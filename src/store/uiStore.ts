// src/store/uiStore.ts
import { create } from 'zustand';

type ActivePanel = 'toc' | 'references' | 'changelog' | 'figures' | null;
type ActiveModal = 'docSettings' | 'export' | 'addRef' | 'editRef' | 'addChangelog' | 'templateSettings' | null;
export type Theme = 'dark' | 'light';

interface UIState {
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  activePanel: ActivePanel;
  activeModal: ActiveModal;
  editingRefId: string | null;
  theme: Theme;

  setSidebarOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setActivePanel: (panel: ActivePanel) => void;
  openModal: (modal: ActiveModal, refId?: string) => void;
  closeModal: () => void;
  toggleTheme: () => void;
}

const storedTheme = (localStorage.getItem('bytedoc-theme') as Theme | null) ?? 'dark';

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  rightPanelOpen: true,
  activePanel: 'toc',
  activeModal: null,
  editingRefId: null,
  theme: storedTheme,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  setActivePanel: (panel) => set({ activePanel: panel, rightPanelOpen: true }),
  openModal: (modal, refId) => set({ activeModal: modal, editingRefId: refId ?? null }),
  closeModal: () => set({ activeModal: null, editingRefId: null }),

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('bytedoc-theme', next);
    set({ theme: next });
  },
}));
