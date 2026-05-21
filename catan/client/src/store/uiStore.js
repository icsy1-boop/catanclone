import { create } from 'zustand';

export const useUIStore = create((set) => ({
  selectedAction: null, // 'BUILD_ROAD' | 'BUILD_SETTLEMENT' | 'BUILD_CITY' | null
  activeModal: null,    // 'TRADE' | 'STEAL' | 'MONOPOLY' | 'YEAR_OF_PLENTY' | null
  pendingRoadBuild: 0,  // 1 or 2 (road building dev card)

  setAction: (action) => set({ selectedAction: action }),
  clearAction: () => set({ selectedAction: null }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}));
