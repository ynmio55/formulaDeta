"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, RefreshCw, AlertCircle } from "lucide-react";

type ScheduledRace = {
  round: number;
  name: string;
  date: string;
  time: string | null;
  circuit: string;
  city: string;
  country: string;
};

type SeasonSchedule = {
  year: number;
  source: "Jolpica";
  races: ScheduledRace[];
};

export default function SeasonScheduleFallback({
  year,
  compact = false,
  retryOriginal,
}: {
  year: number;
  compact?: boolean;
  retryOriginal?: () => void;
}) {
  const { data, isLoading, error, refetch } = useQuery<SeasonSchedule>({
    queryKey: ["jolpica-schedule-fallback", year],
    queryFn: async () => {
      const response = await fetch(`/api/season-schedule?year=${year}`);
      if (!response.ok) throw new Error("Backup calendar is temporarily unavailable");
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const races = data?.races || [];
  const now = Date.now();
  const upcoming = races.find(race => Date.parse(race.date + "T23:59:59Z") >= now);
  const previous = [...races].reverse().find(race => Date.parse(race.date + "T23:59:59Z") < now);
  const shown = compact
    ? [previous, upcoming].filter((r): r is ScheduledRace => Boolean(r))
    : races;

  return (
    <section aria-label="Backup Formula 1 race calendar" className="rounded-2xl border border-amber-800/50 bg-[var(--color-surface-1)] p-5 md:p-8">
      <div className="mb-4 flex items-start gap-3">
        <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-white">
            {year} Race Calendar
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            OpenF1 is temporarily restricting public access during an active session.
            The race schedule below comes from Jolpica and is not live telemetry.
            Session replay and detailed timing require OpenF1 access.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p role="status" className="py-5 text-sm text-[var(--color-text-secondary)]">Loading backup race calendar…</p>
      ) : error ? (
        <div role="alert" className="space-y-3">
          <p className="text-sm text-red-300">{error instanceof Error ? error.message : "Calendar unavailable"}</p>
          <button type="button" onClick={() => void refetch()} className="rounded-lg border border-[var(--color-border-strong)] px-4 py-2 text-sm text-white">Retry backup</button>
        </div>
      ) : races.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">No published races for this season.</p>
      ) : (
        <div className={compact ? "grid gap-3 md:grid-cols-2" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
          {shown.map(race => (
            <article key={race.round} className="min-w-0 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">Round {race.round}</p>
              <h3 className="mt-1 font-semibold text-white">{race.name}</h3>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{race.circuit || race.city}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <CalendarDays aria-hidden="true" size={15} />
                {new Date(race.date + "T12:00:00Z").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
              </p>
            </article>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {retryOriginal && (
          <button onClick={retryOriginal} type="button" className="flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
            <RefreshCw aria-hidden="true" size={15} /> Retry OpenF1
          </button>
        )}
        <Link className="rounded-lg border border-[var(--color-border-strong)] px-4 py-2 text-sm text-white hover:bg-[var(--color-surface-3)]" href={compact ? "/season" : "/championship"}>
          {compact ? "Full season calendar" : "View championship standings"}
        </Link>
      </div>
      <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">Backup calendar by Jolpica · Race rounds are not OpenF1 session IDs.</p>
    </section>
  );
}
