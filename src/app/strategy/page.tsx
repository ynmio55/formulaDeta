"use client";

import { useSearchParams } from "next/navigation";
import { usePitStops, useDrivers, useSessionDetails, useStints, useLaps } from "@/hooks/openf1";
import { formatDateTime } from "@/lib/date-utils";
import { calculateStintTrend } from "@/lib/openf1/strategy-analysis";
import { useTranslation } from "@/i18n/config";
import { Car } from "lucide-react";
import { SessionLayout } from "@/components/session/SessionLayout";
import { Suspense } from "react";

function StrategyContent() {
  const searchParams = useSearchParams();
  const sessionKeyStr = searchParams.get("key");
  const sessionKey = sessionKeyStr ? parseInt(sessionKeyStr, 10) : null;
  const { t } = useTranslation();
  const { data: pits, isLoading: loadingPits } = usePitStops(sessionKey || undefined);
  const { data: drivers } = useDrivers(sessionKey || undefined);
  const { data: stints, isLoading: loadingStints, isError: stintsError } = useStints(sessionKey || undefined);
  const { data: laps } = useLaps(sessionKey || undefined);
  const { data: sessionDetailsData } = useSessionDetails(sessionKey || undefined);
  
  const gmtOffset = sessionDetailsData?.[0]?.gmt_offset;

  if (!sessionKey) {
    return (
      <SessionLayout>
        <div className="text-gray-400 p-8 text-center bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]">
          {t("state.selectSession")}
        </div>
      </SessionLayout>
    );
  }

  const tyreColors: Record<string, string> = {
    SOFT: "#ef4444", MEDIUM: "#eab308", HARD: "#f3f4f6",
    INTERMEDIATE: "#22c55e", WET: "#3b82f6",
  };
  const groupedStints = new Map<number, NonNullable<typeof stints>>();
  for (const stint of stints || []) {
    groupedStints.set(stint.driver_number, [...(groupedStints.get(stint.driver_number) || []), stint]);
  }
  const maxLap = Math.max(1, ...(stints || []).map(stint => stint.lap_end));
  const driverMap = new Map();
  if (drivers) {
    drivers.forEach(d => driverMap.set(d.driver_number, d));
  }

  return (
    <div className="space-y-6">
      <section aria-label="Tyre stint strategy" className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-4 md:p-6">
        <h2 className="mb-1 text-lg font-semibold">Tyre Stint Timeline</h2>
        <p className="mb-5 text-xs text-[var(--color-text-tertiary)]">Recorded stint data · tyre compound and lap ranges</p>
        {loadingStints ? (
          <div role="status" className="animate-pulse space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 rounded bg-[var(--color-surface-2)]" />)}
          </div>
        ) : stintsError ? (
          <p role="alert" className="text-sm text-red-400">Could not retrieve tyre stint data for this session.</p>
        ) : groupedStints.size === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">No tyre stint records available.</p>
        ) : (
          <div className="space-y-3 overflow-x-auto">
            {[...groupedStints.entries()].sort(([a],[b]) => a-b).map(([number, group]) => (
              <div key={number} className="flex min-w-[440px] items-center gap-3">
                <span className="w-28 shrink-0 truncate text-xs font-medium" title={driverMap.get(number)?.full_name}>
                  {driverMap.get(number)?.name_acronym || ("#" + number)}
                </span>
                <div className="flex h-9 flex-1 gap-px overflow-hidden rounded-md bg-[var(--color-surface-2)]">
                  {[...group].sort((a,b) => a.stint_number - b.stint_number).map(stint => {
                    const label = stint.compound || "UNKNOWN";
                    return (
                      <div key={stint.stint_number} title={label + " · laps " + stint.lap_start + "–" + stint.lap_end}
                        aria-label={"Car " + number + ", " + label + ", laps " + stint.lap_start + " to " + stint.lap_end}
                        style={{width: (Math.max(1, stint.lap_end - stint.lap_start + 1) / maxLap * 100) + "%",
                          backgroundColor: tyreColors[label.toUpperCase()] || "#64748b"}}
                        className="flex items-center justify-center overflow-hidden text-[10px] font-bold text-black">
                        <span className="truncate px-1">{label.charAt(0)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section aria-label="Lap-time trends by stint" className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-4 md:p-6">
        <h2 className="text-lg font-semibold">Observed lap-time trends</h2>
        <p className="mt-1 mb-4 text-xs text-[var(--color-text-tertiary)]">
          Linear trend by stint (s/lap). Positive means slower later laps. This is not a tyre-degradation prediction.
        </p>
        {!laps?.length || !stints?.length ? (
          <p className="text-sm text-[var(--color-text-secondary)]">Lap/stint analysis data is unavailable.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead className="border-b border-[var(--color-border-subtle)] text-xs uppercase text-gray-400">
                <tr><th className="p-3">Driver</th><th className="p-3">Tyre</th><th className="p-3">Laps</th><th className="p-3 text-right">Trend (s/lap)</th></tr>
              </thead>
              <tbody>
                {stints.map(stint => {
                  const trend = calculateStintTrend(laps, stint.driver_number, stint.lap_start, stint.lap_end);
                  return (
                    <tr key={String(stint.driver_number) + "-" + stint.stint_number}
                      className="border-b border-[var(--color-border-subtle)]">
                      <td className="p-3">{driverMap.get(stint.driver_number)?.name_acronym || "#" + stint.driver_number}</td>
                      <td className="p-3">{stint.compound || "—"}</td>
                      <td className="p-3 tabular-nums">{stint.lap_start}–{stint.lap_end}</td>
                      <td className="p-3 text-right font-mono tabular-nums">
                        {trend ? (trend.slope >= 0 ? "+" : "") + trend.slope.toFixed(3) : "Insufficient laps"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden shadow-sm">
        {loadingPits ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">{t("state.loading")}</div>
        ) : pits && pits.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#151515] text-gray-400 border-b border-[var(--color-border-strong)]">
                <tr>
                  <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Time</th>
                  <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Driver</th>
                  <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Lap</th>
                  <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs text-right">Pit Duration</th>
                  <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs text-right">Stop Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {pits.map((p, i) => {
                  const driver = driverMap.get(p.driver_number);
                  return (
                    <tr key={i} className="hover:bg-[var(--color-surface-3)] transition-colors">
                      <td className="px-5 py-3 text-gray-400 tabular-nums">{formatDateTime(p.date, "HH:mm:ss", gmtOffset)}</td>
                      <td className="px-5 py-3 font-bold text-gray-200">
                        {driver?.full_name || `Car #${p.driver_number}`}
                      </td>
                      <td className="px-5 py-3 tabular-nums">{p.lap_number || "-"}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-white">{p.pit_duration ? p.pit_duration.toFixed(3) : "-"}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-bold text-red-400">{p.stop_duration ? p.stop_duration.toFixed(3) : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
           <div className="p-16 text-center text-gray-500">{t("state.noData")}</div>
        )}
      </div>
    </div>
  );
}

export default function StrategyDashboard() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]"></div>}>
      <SessionLayout>
        <StrategyContent />
      </SessionLayout>
    </Suspense>
  );
}
