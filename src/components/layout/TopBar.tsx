"use client";

import { useSettingsStore, Locale, Timezone } from "@/lib/settings-store";
import { useTranslation } from "@/i18n/config";
import { GlobalSearch } from "./GlobalSearch";

export default function TopBar() {
  const { isReady } = useTranslation();

  if (!isReady) return null; // Avoid hydration mismatch

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-[#0a0a0a] border-b border-[var(--color-border-subtle)] px-4 md:px-8 py-3 mb-6 gap-4 sticky top-0 z-50">
      <div className="flex-1 w-full sm:w-auto flex items-center gap-4">
        {/* Brand Name on the left next to Sidebar */}
        <div className="hidden md:flex items-center">
          <h2 className="text-xl font-bold tracking-tight text-white leading-tight flex items-center gap-1">
            Formula<span className="text-[var(--color-f1-red)] font-normal">Data</span>
          </h2>
        </div>
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-4">
      </div>
    </div>
  );
}
