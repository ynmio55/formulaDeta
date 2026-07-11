import { create } from "zustand";

interface AppState {
  year: number;
  setYear: (year: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  year: new Date().getFullYear(),
  setYear: (year) => set({ year }),
}));
