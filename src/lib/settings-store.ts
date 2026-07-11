import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "en" | "th";
export type Timezone = "Asia/Bangkok" | "UTC" | "Circuit" | "Device";

interface SettingsState {
  locale: Locale;
  timezone: Timezone;
  setLocale: (locale: Locale) => void;
  setTimezone: (timezone: Timezone) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: "en", // Will be hydrated from local storage or set dynamically
      timezone: "Asia/Bangkok",
      setLocale: (locale) => set({ locale }),
      setTimezone: (timezone) => set({ timezone }),
    }),
    {
      name: "f1-settings",
    }
  )
);
