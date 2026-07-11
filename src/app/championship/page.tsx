"use client";

import { fetchOpenF1 } from "@/lib/openf1/client";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Users, ShieldAlert } from "lucide-react";
import { useState, Suspense } from "react";
import { useAppStore } from "@/lib/store";

function useDriversChampionship(year: number) {
  return useQuery({
    queryKey: ["championship_drivers", year],
    // The endpoint is beta. We use year directly or meeting_key. 
    // The beta endpoints may only work by meeting_key. Let's use latest meeting for the year.
    queryFn: () => fetchOpenF1("/v1/championship_drivers", { meeting_key: "latest" }),
  });
}

function useTeamsChampionship(year: number) {
  return useQuery({
    queryKey: ["championship_teams", year],
    queryFn: () => fetchOpenF1("/v1/championship_teams", { meeting_key: "latest" }),
  });
}

function ChampionshipContent() {
  const { year } = useAppStore();
  const [activeTab, setActiveTab] = useState<"drivers" | "teams">("drivers");
  
  const { data: driversStats, isLoading: loadingDrivers, isError: errDrivers } = useDriversChampionship(year);
  const { data: teamsStats, isLoading: loadingTeams, isError: errTeams } = useTeamsChampionship(year);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 border-b border-[var(--color-border-subtle)] pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Championship Standings</h1>
        <p className="text-gray-400">Current season standings. (Note: These endpoints are currently in beta).</p>
      </header>

      <div className="flex gap-2 border-b border-[var(--color-border-subtle)] pb-4">
        <button 
          onClick={() => setActiveTab("drivers")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'drivers' ? 'bg-[var(--color-f1-red-hover)] text-white' : 'bg-[var(--color-surface-1)] text-gray-400 hover:bg-[var(--color-surface-3)]'}`}
        >
          <div className="flex items-center gap-2"><Users className="w-4 h-4"/> Drivers</div>
        </button>
        <button 
          onClick={() => setActiveTab("teams")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'teams' ? 'bg-[var(--color-f1-red-hover)] text-white' : 'bg-[var(--color-surface-1)] text-gray-400 hover:bg-[var(--color-surface-3)]'}`}
        >
          <div className="flex items-center gap-2"><Trophy className="w-4 h-4"/> Constructors</div>
        </button>
      </div>

      <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
        {activeTab === "drivers" && (
          <div>
            {loadingDrivers ? (
              <div className="p-8 text-center text-gray-500 animate-pulse">Loading driver standings...</div>
            ) : errDrivers ? (
               <div className="p-8 text-center text-[var(--color-f1-red)] flex flex-col items-center gap-2">
                 <ShieldAlert className="w-6 h-6" />
                 Beta endpoint is currently unavailable or returned an error.
               </div>
            ) : driversStats && driversStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--color-surface-3)] text-gray-400 border-b border-[var(--color-border-strong)]">
                    <tr>
                      <th className="px-6 py-4 font-medium">Pos</th>
                      <th className="px-6 py-4 font-medium w-full">Driver No</th>
                      <th className="px-6 py-4 font-medium text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {/* Sort by points_current descending */}
                    {[...driversStats].sort((a, b) => (b.points_current || 0) - (a.points_current || 0)).map((driver) => (
                      <tr key={driver.driver_number} className="hover:bg-[#151515]">
                        <td className="px-6 py-4 font-bold">{driver.position_current}</td>
                        <td className="px-6 py-4 font-medium">#{driver.driver_number}</td>
                        <td className="px-6 py-4 text-right font-semibold">{driver.points_current}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No driver standings available.</div>
            )}
          </div>
        )}

        {activeTab === "teams" && (
          <div>
             {loadingTeams ? (
              <div className="p-8 text-center text-gray-500 animate-pulse">Loading constructor standings...</div>
            ) : errTeams ? (
               <div className="p-8 text-center text-[var(--color-f1-red)] flex flex-col items-center gap-2">
                 <ShieldAlert className="w-6 h-6" />
                 Beta endpoint is currently unavailable or returned an error.
               </div>
            ) : teamsStats && teamsStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--color-surface-3)] text-gray-400 border-b border-[var(--color-border-strong)]">
                    <tr>
                      <th className="px-6 py-4 font-medium">Pos</th>
                      <th className="px-6 py-4 font-medium w-full">Team</th>
                      <th className="px-6 py-4 font-medium text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {[...teamsStats].sort((a, b) => (b.points_current || 0) - (a.points_current || 0)).map((team, idx) => (
                      <tr key={team.team_name || idx} className="hover:bg-[#151515]">
                        <td className="px-6 py-4 font-bold">{team.position_current}</td>
                        <td className="px-6 py-4 font-medium">{team.team_name}</td>
                        <td className="px-6 py-4 text-right font-semibold">{team.points_current}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No constructor standings available.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChampionshipDashboard() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]"></div>}>
      <ChampionshipContent />
    </Suspense>
  );
}
