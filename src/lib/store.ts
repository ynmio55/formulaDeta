import { create } from "zustand";

interface AppState {
  year: number;
  setYear: (year: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  year: 2026, // Reverted to 2026 to support custom 2026 grid (Audi, Cadillac)
  setYear: (year) => set({ year }),
}));
