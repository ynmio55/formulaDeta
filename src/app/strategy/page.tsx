"use client";

import { useSearchParams } from "next/navigation";
import { usePitStops, useDrivers, useSessionDetails } from "@/hooks/openf1";
import { formatDateTime } from "@/lib/date-utils";
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

  const driverMap = new Map();
  if (drivers) {
    drivers.forEach(d => driverMap.set(d.driver_number, d));
  }

  return (
    <div className="space-y-6">
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
