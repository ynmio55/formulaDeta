"use client";

import { useTranslation } from "@/i18n/config";
import { useAppStore } from "@/lib/store";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const YEARS = [2026, 2025, 2024, 2023]; // Natively supported by OpenF1

interface SeasonHeaderProps {
  completedRaces: number;
  totalRaces: number;
}

export default function SeasonHeader({ completedRaces, totalRaces }: SeasonHeaderProps) {
  const { t } = useTranslation();
  const { year, setYear } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sync year from URL query param to store
  useEffect(() => {
    const yearParam = searchParams.get("year");
    if (yearParam) {
      const parsed = Number(yearParam);
      if (YEARS.includes(parsed) && parsed !== year) {
        setYear(parsed);
      }
    }
  }, [searchParams, year, setYear]);

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
    router.push(`/season?year=${newYear}`);
  };

  const progressPct = totalRaces > 0 ? (completedRaces / totalRaces) * 100 : 0;

  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--color-border-subtle)] pb-6 mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">{t("season.title")}</h1>
        <p className="text-[#888] mt-2 text-sm">{t("season.subtitle")}</p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Progress Bar */}
        <div className="w-full sm:w-48">
          <div className="flex justify-between text-xs text-[#888] mb-1.5 uppercase tracking-wider">
            <span>{t("season.progress.completed")} ({completedRaces})</span>
            <span>{t("season.progress.remaining")} ({totalRaces - completedRaces})</span>
          </div>
          <div className="h-1.5 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--color-f1-red-hover)] transition-all duration-1000 ease-in-out" 
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="year-select" className="text-xs font-semibold text-[#666] uppercase tracking-wider">Year:</label>
          <select 
            id="year-select"
            value={year}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="bg-[var(--color-surface-1)] border border-[var(--color-border-strong)] rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--color-f1-red)] tabular-nums transition-colors cursor-pointer hover:bg-[var(--color-surface-3)]"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
