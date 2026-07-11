"use client";

import { useSettingsStore, Locale, Timezone } from "@/lib/settings-store";
import { useTranslation } from "@/i18n/config";
import { Globe, Clock } from "lucide-react";

export default function TopBar() {
  const { locale, setLocale, timezone, setTimezone } = useSettingsStore();
  const { t, isReady } = useTranslation();

  if (!isReady) return null; // Avoid hydration mismatch

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-[#0a0a0a] border-b border-[var(--color-border-subtle)] px-4 md:px-8 py-3 mb-6 gap-4 sticky top-0 z-50">
      <div className="flex-1"></div>
      
      <div className="flex items-center gap-4">
        {/* Timezone Selector */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value as Timezone)}
            className="bg-[var(--color-surface-1)] border border-[var(--color-border-strong)] rounded-md px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-[var(--color-f1-red)] transition-colors"
          >
            <option value="Asia/Bangkok">{t("timezone.bangkok")}</option>
            <option value="UTC">{t("timezone.utc")}</option>
            <option value="Circuit">{t("timezone.circuit")}</option>
            <option value="Device">{t("timezone.device")}</option>
          </select>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="bg-[var(--color-surface-1)] border border-[var(--color-border-strong)] rounded-md px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-[var(--color-f1-red)] transition-colors"
          >
            <option value="th">ไทย</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </div>
  );
}
