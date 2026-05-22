import { create } from 'zustand';

export const useUIStore = create((set) => ({
  selectedAction: null,
  activeModal: null,
  pendingRoadBuild: 0,
  toasts: [],

  setAction: (action) => set({ selectedAction: action }),
  clearAction: () => set({ selectedAction: null }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  addToast: (message, type = 'error') => set(state => ({
    toasts: [...state.toasts, { id: Date.now() + Math.random(), message, type }],
  })),
  removeToast: (id) => set(state => ({
    toasts: state.toasts.filter(t => t.id !== id),
  })),
}));
