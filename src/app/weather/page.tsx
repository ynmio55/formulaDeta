"use client";

import { useSearchParams } from "next/navigation";
import { useWeather, useSessionDetails } from "@/hooks/openf1";
import { formatDateTime } from "@/lib/date-utils";
import { useTranslation } from "@/i18n/config";
import { CloudLightning } from "lucide-react";
import { SessionLayout } from "@/components/session/SessionLayout";
import { Suspense } from "react";

function WeatherContent() {
  const searchParams = useSearchParams();
  const sessionKeyStr = searchParams.get("key");
  const sessionKey = sessionKeyStr === "latest" ? "latest" : (sessionKeyStr ? parseInt(sessionKeyStr, 10) : null);

  const { t } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: weather, isLoading: loadingWeather } = useWeather((sessionKey as any) || undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionDetailsData } = useSessionDetails((sessionKey as any) || undefined);
  
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

  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden shadow-sm">
        {loadingWeather ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">{t("state.loading")}</div>
        ) : weather && weather.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#151515] text-gray-400 border-b border-[var(--color-border-strong)]">
                <tr>
                  <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Time</th>
                  <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Air Temp</th>
                  <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Track Temp</th>
                  <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Humidity</th>
                  <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Wind</th>
                  <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Rain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {weather.map((w, i) => (
                  <tr key={i} className="hover:bg-[var(--color-surface-3)] transition-colors">
                    <td className="px-5 py-3 font-bold text-gray-200 tabular-nums">{formatDateTime(w.date, "HH:mm:ss", gmtOffset)}</td>
                    <td className="px-5 py-3 tabular-nums">{w.air_temperature}°C</td>
                    <td className="px-5 py-3 tabular-nums text-white font-medium">{w.track_temperature}°C</td>
                    <td className="px-5 py-3 tabular-nums">{w.humidity}%</td>
                    <td className="px-5 py-3 tabular-nums text-gray-400">{w.wind_speed} m/s ({w.wind_direction}°)</td>
                    <td className="px-5 py-3">
                      {w.rainfall > 0 ? <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded-sm text-xs uppercase tracking-widest border border-blue-500/20">Yes</span> : <span className="text-gray-500 text-xs uppercase tracking-widest">No</span>}
                    </td>
                  </tr>
                ))}
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

export default function WeatherDashboard() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]"></div>}>
      <SessionLayout>
        <WeatherContent />
      </SessionLayout>
    </Suspense>
  );
}
