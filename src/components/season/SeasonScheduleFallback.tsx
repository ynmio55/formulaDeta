"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Flag, RefreshCw, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/i18n/config";

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
  const { locale } = useTranslation();
  const th = locale === "th";
  const words = th ? {
    title: "ภาพรวมฤดูกาล",
    subtitle: "ปฏิทินการแข่งขันจาก Jolpica · ไม่ใช่ข้อมูลจับเวลาแบบสด",
    restricted: "ขณะนี้ไม่สามารถเข้าถึงข้อมูล OpenF1 ได้ จึงแสดงปฏิทินจากแหล่งสำรองแทน ข้อมูล Telemetry, Replay และเซสชันยังต้องใช้ OpenF1",
    next: "สนามถัดไป",
    last: "สนามล่าสุด",
    full: "ดูปฏิทินทั้งฤดูกาล",
    standings: "ดูตารางคะแนน",
    retry: "ลองเชื่อมต่อ OpenF1",
    tryBackup: "ลองโหลดปฏิทินอีกครั้ง",
    loading: "กำลังโหลดปฏิทินสำรอง...",
    unavailable: "ขณะนี้ไม่สามารถโหลดปฏิทินสำรองได้",
    empty: "ยังไม่มีข้อมูลปฏิทินของฤดูกาลนี้",
    completed: "ผ่านไปแล้ว",
    remaining: "เหลือการแข่งขัน",
    races: "สนามทั้งหมด",
    round: "สนามที่",
    noUpcoming: "ไม่มีสนามถัดไปในฤดูกาลนี้",
    noPrevious: "ยังไม่มีการแข่งขันที่ผ่านมา",
    note: "ข้อมูลจาก Jolpica · หมายเลขรอบไม่ใช่รหัส Session ของ OpenF1",
  } : {
    title: "Season Overview",
    subtitle: "Race calendar from Jolpica · Not live timing data",
    restricted: "OpenF1 data is currently inaccessible, so this view uses an independent race calendar. Telemetry, replay and session timing still require OpenF1.",
    next: "Next Grand Prix",
    last: "Previous Grand Prix",
    full: "Full season calendar",
    standings: "Championship standings",
    retry: "Retry OpenF1",
    tryBackup: "Retry calendar",
    loading: "Loading backup race calendar...",
    unavailable: "The backup calendar is temporarily unavailable",
    empty: "No published races for this season",
    completed: "Completed",
    remaining: "Remaining",
    races: "Total rounds",
    round: "Round",
    noUpcoming: "No upcoming races this season",
    noPrevious: "No previous race yet",
    note: "Source: Jolpica · Race rounds are not OpenF1 session IDs",
  };

  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery<SeasonSchedule>({
    queryKey: ["jolpica-schedule-fallback", year],
    queryFn: async () => {
      const response = await fetch(`/api/season-schedule?year=${year}`);
      if (!response.ok) throw new Error(words.unavailable);
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const races = data?.races || [];
  // Use the query timestamp so render is deterministic and React's purity lint passes.
  const currentTime = dataUpdatedAt;
  const raceEndsAt = (race: ScheduledRace) => Date.parse(race.date + "T23:59:59Z");
  const completed = races.filter(race => raceEndsAt(race) < currentTime).length;
  const upcoming = races.find(race => raceEndsAt(race) >= currentTime);
  const previous = [...races].reverse().find(race => raceEndsAt(race) < currentTime);
  const dateLocale = th ? "th-TH-u-ca-gregory" : "en-GB";
  const formatRaceDate = (date: string) =>
    new Date(date + "T12:00:00Z").toLocaleDateString(dateLocale, {
      day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
    });

  const renderRace = (race: ScheduledRace, label?: string) => (
    <article key={race.round} className="min-w-0 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label ? `${label} · ${words.round} ${race.round}` : `${words.round} ${race.round}`}
      </p>
      <h3 className="mt-2 text-base font-bold text-white">{race.name}</h3>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{race.circuit || race.city}</p>
      <p className="mt-2 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <CalendarDays size={15} aria-hidden="true" />{formatRaceDate(race.date)}
      </p>
    </article>
  );

  return (
    <section aria-label="Backup Formula 1 race calendar" className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-red-400">Formula Data / {year}</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">{words.title} {year}</h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{words.subtitle}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-md border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-xs text-amber-300">
            <AlertTriangle size={15} aria-hidden="true" /> OpenF1 unavailable
          </span>
        </div>
        <p role="status" className="border-l-2 border-amber-600 pl-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          {words.restricted}
        </p>
      </div>

      {isLoading ? (
        <div role="status" className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-8 text-sm text-[var(--color-text-secondary)]">{words.loading}</div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-red-900/60 bg-red-950/20 p-6">
          <p className="mb-4 text-sm text-red-300">{words.unavailable}</p>
          <button type="button" onClick={() => void refetch()} className="rounded-md bg-red-700 px-4 py-2 text-sm text-white">
            {words.tryBackup}
          </button>
        </div>
      ) : races.length === 0 ? (
        <p className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-8 text-center text-sm text-[var(--color-text-secondary)]">{words.empty}</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: words.races, count: races.length },
              { label: words.completed, count: completed },
              { label: words.remaining, count: races.length - completed },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-4 md:p-5">
                <p className="text-xs text-[var(--color-text-secondary)]">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-white md:text-3xl">{stat.count}</p>
              </div>
            ))}
          </div>

          {compact ? (
            <div className="grid gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                {upcoming ? (
                  <div className="h-full rounded-2xl border border-red-950 bg-[linear-gradient(135deg,#240808_0%,#121212_75%)] p-6 md:p-8">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-400">
                      <Flag size={16} aria-hidden="true" /> {words.next} · {words.round} {upcoming.round}
                    </p>
                    <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-white md:text-3xl">{upcoming.name}</h2>
                    <p className="mt-3 text-sm text-gray-300">{upcoming.circuit}</p>
                    <p className="mt-2 text-sm text-gray-300">{formatRaceDate(upcoming.date)}</p>
                    <Link href={`/season?year=${year}`} className="mt-8 inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600">
                      {words.full} <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-6 text-sm text-[var(--color-text-secondary)]">{words.noUpcoming}</div>
                )}
              </div>
              <div className="lg:col-span-2">
                {previous ? renderRace(previous, words.last) : (
                  <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-6 text-sm text-[var(--color-text-secondary)]">{words.noPrevious}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {races.map(race => renderRace(race))}
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {retryOriginal && (
          <button onClick={retryOriginal} type="button" className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
            <RefreshCw size={15} aria-hidden="true" /> {words.retry}
          </button>
        )}
        <Link className="rounded-lg border border-[var(--color-border-strong)] px-4 py-2 text-sm text-white hover:bg-[var(--color-surface-2)]" href={compact ? `/season?year=${year}` : "/championship"}>
          {compact ? words.full : words.standings}
        </Link>
        <p className="w-full text-xs text-[var(--color-text-tertiary)]">{words.note}</p>
      </div>
    </section>
  );
}
