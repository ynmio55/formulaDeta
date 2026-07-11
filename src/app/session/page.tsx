"use client";

import { useSessionResult, useDrivers, useSessionDetails } from "@/hooks/openf1";
import { formatDateTime } from "@/lib/date-utils";
import { useTranslation } from "@/i18n/config";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchOpenF1 } from "@/lib/openf1/client";
import { SessionLayout } from "@/components/session/SessionLayout";

// Extra hooks needed here
function useRaceControlMessages(sessionKey: number) {
  return useQuery({
    queryKey: ["race_control", sessionKey],
    queryFn: () => fetchOpenF1("/v1/race_control", { session_key: sessionKey }),
    enabled: !!sessionKey,
  });
}

function useStartingGridData(sessionKey: number) {
  return useQuery({
    queryKey: ["starting_grid", sessionKey],
    queryFn: () => fetchOpenF1("/v1/starting_grid", { session_key: sessionKey }),
    enabled: !!sessionKey,
  });
}

type TabType = "classification" | "grid" | "race_control" | "weather" | "pits";

function SessionContent() {
  const searchParams = useSearchParams();
  const sessionKeyStr = searchParams.get("key");
  const sessionKey = sessionKeyStr ? parseInt(sessionKeyStr, 10) : null;
  const [activeTab, setActiveTab] = useState<TabType>("classification");
  const { t, isReady } = useTranslation();

  const { data: sessionDetailsData } = useSessionDetails(sessionKey || undefined);
  const sessionDetails = sessionDetailsData?.[0];
  const gmtOffset = sessionDetails?.gmt_offset;

  const { data: results, isLoading: loadingResults } = useSessionResult(sessionKey || undefined);
  const { data: drivers, isLoading: loadingDrivers } = useDrivers(sessionKey || undefined);
  const { data: raceControl, isLoading: loadingRc } = useRaceControlMessages(sessionKey!);
  const { data: grid, isLoading: loadingGrid } = useStartingGridData(sessionKey!);

  if (!isReady) return null;

  if (!sessionKey) {
    return <div className="text-gray-400 p-8 text-center bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]">Please select a session from the Meeting page.</div>;
  }

  // Create a driver lookup map
  const driverMap = new Map();
  if (drivers) {
    drivers.forEach(d => {
      driverMap.set(d.driver_number, d);
    });
  }

  return (
    <div className="space-y-6">
      <div className="pt-2">
        {activeTab === "classification" && (
          <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden shadow-sm">
             {loadingResults ? (
               <div className="p-8 text-center text-gray-500 animate-pulse">{t("state.loading")}</div>
             ) : results && results.length > 0 ? (
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                   <thead className="bg-[#151515] text-gray-400 border-b border-[var(--color-border-strong)]">
                     <tr>
                       <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Pos</th>
                       <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">No</th>
                       <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs w-full">Driver</th>
                       <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Team</th>
                       <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs text-right">Laps</th>
                       <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[#222]">
                     {results.map((res) => {
                       const driver = driverMap.get(res.driver_number);
                       return (
                         <tr key={res.driver_number} className="hover:bg-[var(--color-surface-3)] transition-colors">
                           <td className="px-5 py-3 font-bold text-white">{res.position}</td>
                           <td className="px-5 py-3 text-gray-400 tabular-nums">{res.driver_number}</td>
                           <td className="px-5 py-3 font-bold text-gray-200 flex items-center gap-3">
                             {driver && (
                               <div className="w-1 h-4 rounded-full" style={{ backgroundColor: `#${driver.team_colour}` }}></div>
                             )}
                             {driver?.full_name || "Unknown"}
                           </td>
                           <td className="px-5 py-3 text-gray-400">{driver?.team_name || "-"}</td>
                           <td className="px-5 py-3 text-right tabular-nums text-white">{res.number_of_laps}</td>
                           <td className="px-5 py-3 text-xs uppercase font-bold tracking-widest">
                             {res.dnf ? <span className="text-[var(--color-f1-red)] bg-[var(--color-f1-red)]/10 px-2 py-1 rounded-sm border border-[var(--color-f1-red)]/20">DNF</span> : 
                              res.dns ? <span className="text-orange-500 bg-orange-500/10 px-2 py-1 rounded-sm border border-orange-500/20">DNS</span> : 
                              <span className="text-gray-500">Finished</span>}
                           </td>
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
        )}

        {activeTab === "grid" && (
           <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden shadow-sm">
             {loadingGrid ? (
               <div className="p-8 text-center text-gray-500 animate-pulse">{t("state.loading")}</div>
             ) : grid && grid.length > 0 ? (
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-[#151515] text-gray-400 border-b border-[var(--color-border-strong)]">
                     <tr>
                       <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Grid Pos</th>
                       <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs w-full">Driver</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[#222]">
                     {grid.map((pos) => {
                       const driver = driverMap.get(pos.driver_number);
                       return (
                         <tr key={pos.driver_number} className="hover:bg-[var(--color-surface-3)] transition-colors">
                           <td className="px-5 py-3 font-bold text-white">{pos.position}</td>
                           <td className="px-5 py-3 font-bold text-gray-200 flex items-center gap-3">
                             {driver && (
                               <div className="w-1 h-4 rounded-full" style={{ backgroundColor: `#${driver.team_colour}` }}></div>
                             )}
                             {driver?.full_name || `Car #${pos.driver_number}`}
                           </td>
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
        )}

        {activeTab === "race_control" && (
           <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden p-6 shadow-sm">
             {loadingRc ? (
               <div className="p-8 text-center text-gray-500 animate-pulse">{t("state.loading")}</div>
             ) : raceControl && raceControl.length > 0 ? (
               <div className="space-y-4">
                 {raceControl.map((msg, i) => (
                   <div key={i} className="flex gap-4 text-sm border-l-2 pl-4 pb-4 border-[var(--color-border-strong)] last:pb-0">
                     <div className="text-gray-500 w-24 shrink-0 whitespace-nowrap tabular-nums">
                       {formatDateTime(msg.date, "HH:mm:ss", gmtOffset)}
                     </div>
                     <div className="flex-1">
                       <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-widest mr-3 font-bold border 
                         ${msg.category === 'Flag' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                           msg.category === 'Incident' ? 'bg-[var(--color-f1-red)]/10 text-[var(--color-f1-red)] border-[var(--color-f1-red)]/20' : 
                           'bg-[var(--color-surface-2)] text-gray-400 border-[var(--color-border-strong)]'}`
                       }>
                         {msg.category}
                       </span>
                       <span className="text-gray-200 font-medium">{msg.message}</span>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
                <div className="p-16 text-center text-gray-500">{t("state.noData")}</div>
             )}
          </div>
        )}


      </div>
    </div>
  );
}

export default function SessionDetail() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]"></div>}>
      <SessionLayout>
        <SessionContent />
      </SessionLayout>
    </Suspense>
  );
}
