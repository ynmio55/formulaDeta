"use client";

import { fetchOpenF1 } from "@/lib/openf1/client";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Users, ShieldAlert } from "lucide-react";
import { useState, Suspense } from "react";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";

function useDriversChampionship(year: number) {
  return useQuery({
    queryKey: ["championship_drivers", year],
    queryFn: () => fetchOpenF1("/v1/championship_drivers", { meeting_key: "latest" }),
  });
}

function useAllDrivers() {
  return useQuery({
    queryKey: ["all_drivers", "latest"],
    queryFn: () => fetchOpenF1("/v1/drivers", { session_key: "latest" }),
  });
}

function useTeamsChampionship(year: number) {
  return useQuery({
    queryKey: ["championship_teams", year],
    queryFn: () => fetchOpenF1("/v1/championship_teams", { meeting_key: "latest" }),
  });
}

const DRIVER_FALLBACK: Record<number, { full_name: string, team_name: string, team_colour: string, headshot_url?: string }> = {
  1: { full_name: "Max Verstappen", team_name: "Red Bull Racing", team_colour: "3671C6" },
  11: { full_name: "Sergio Perez", team_name: "Red Bull Racing", team_colour: "3671C6" },
  44: { full_name: "Lewis Hamilton", team_name: "Ferrari", team_colour: "E8002D" }, // Assuming 2025+
  16: { full_name: "Charles Leclerc", team_name: "Ferrari", team_colour: "E8002D" },
  4: { full_name: "Lando Norris", team_name: "McLaren", team_colour: "FF8000" },
  81: { full_name: "Oscar Piastri", team_name: "McLaren", team_colour: "FF8000" },
  63: { full_name: "George Russell", team_name: "Mercedes", team_colour: "27F4D2" },
  12: { full_name: "Andrea Kimi Antonelli", team_name: "Mercedes", team_colour: "27F4D2" }, // 2025
  14: { full_name: "Fernando Alonso", team_name: "Aston Martin", team_colour: "229971" },
  18: { full_name: "Lance Stroll", team_name: "Aston Martin", team_colour: "229971" },
  10: { full_name: "Pierre Gasly", team_name: "Alpine", team_colour: "FF87BC" },
  7: { full_name: "Jack Doohan", team_name: "Alpine", team_colour: "FF87BC" },
  23: { full_name: "Alexander Albon", team_name: "Williams", team_colour: "64C4FF" },
  55: { full_name: "Carlos Sainz", team_name: "Williams", team_colour: "64C4FF" },
  22: { full_name: "Yuki Tsunoda", team_name: "Racing Bulls", team_colour: "6692FF" },
  30: { full_name: "Liam Lawson", team_name: "Racing Bulls", team_colour: "6692FF" },
  77: { full_name: "Valtteri Bottas", team_name: "Kick Sauber", team_colour: "52E252" }, // Adjust as needed
  27: { full_name: "Nico Hulkenberg", team_name: "Kick Sauber", team_colour: "52E252" },
  31: { full_name: "Esteban Ocon", team_name: "Haas F1 Team", team_colour: "B6BABD" },
  87: { full_name: "Oliver Bearman", team_name: "Haas F1 Team", team_colour: "B6BABD" },
};

function ChampionshipContent() {
  const { year } = useAppStore();
  const [activeTab, setActiveTab] = useState<"drivers" | "teams">("drivers");
  const router = useRouter();
  
  const { data: rawDriversStats, isLoading: loadingDrivers, isError: errDrivers } = useDriversChampionship(year);
  const { data: rawTeamsStats, isLoading: loadingTeams, isError: errTeams } = useTeamsChampionship(year);
  const { data: allDrivers } = useAllDrivers();

  const driversStats = rawDriversStats ? Array.from(new Map(rawDriversStats.map((d: any) => [d.driver_number, d])).values()).sort((a, b) => (b.points_current || 0) - (a.points_current || 0)) : [];
  const teamsStats = rawTeamsStats ? Array.from(new Map(rawTeamsStats.map((t: any) => [t.team_name, t])).values()).sort((a, b) => (b.points_current || 0) - (a.points_current || 0)) : [];
  
  const driversMap = new Map();
  if (allDrivers && Array.isArray(allDrivers) && allDrivers.length > 0) {
    allDrivers.forEach((d: any) => driversMap.set(d.driver_number, d));
  } else {
    // Use fallback if API failed or returned empty
    Object.entries(DRIVER_FALLBACK).forEach(([num, data]) => {
      driversMap.set(parseInt(num), { driver_number: parseInt(num), ...data });
    });
  }

  const getTeamCarUrl = (name: string) => {
    if (year === 2026) {
      const strippedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return `/cars/2026/2026${strippedName}carright.avif`;
    }

    const map: Record<string, string> = {
      'Mercedes': 'mercedes',
      'Ferrari': 'ferrari',
      'McLaren': 'mclaren',
      'Red Bull Racing': 'red-bull-racing',
      'Alpine': 'alpine',
      'Racing Bulls': 'rb',
      'Haas F1 Team': 'haas-f1-team',
      'Williams': 'williams',
      'Aston Martin': 'aston-martin',
      'Audi': 'kick-sauber', 
      'Cadillac': 'generic',
      'Kick Sauber': 'kick-sauber',
    };
    const slug = map[name] || name.toLowerCase().replace(/\s+/g, '-');
    return `https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/${slug}.png.transform/9col/image.png`;
  };

  const getPodiumOrder = (items: any[]) => {
    return items; // Let CSS flex order handle the visual arrangement
  };

  const top3Drivers = driversStats.slice(0, 3);
  const restDrivers = driversStats.slice(3);

  const top3Teams = teamsStats.slice(0, 3);
  const restTeams = teamsStats.slice(3);

  return (
    <div className="space-y-6 pb-24">
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

      <div className="animate-in fade-in duration-500">
        {activeTab === "drivers" && (
          <div className="space-y-12">
            {loadingDrivers ? (
              <div className="p-8 text-center text-gray-500 animate-pulse">Loading driver standings...</div>
            ) : errDrivers ? (
               <div className="p-8 text-center text-[var(--color-f1-red)] flex flex-col items-center gap-2">
                 <ShieldAlert className="w-6 h-6" />
                 Beta endpoint is currently unavailable or returned an error.
               </div>
            ) : driversStats && driversStats.length > 0 ? (
              <>
                {/* Driver Podium */}
                {top3Drivers.length >= 3 && (
                  <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-6 px-2 md:px-4 pt-10">
                    {top3Drivers.map((driver, index) => {
                      const info = driversMap.get(driver.driver_number);
                      const displayName = info ? info.full_name : `Driver #${driver.driver_number}`;
                      const photoUrl = info?.headshot_url?.replace('1col', '9col');
                      const teamColor = info?.team_colour || "333333";
                      const isFirst = driver.position_current === 1;
                      const orderClass = index === 0 ? "order-1 md:order-2" : index === 1 ? "order-2 md:order-1" : "order-3 md:order-3";

                      return (
                        <div 
                          key={driver.driver_number} 
                          onClick={() => router.push(`/driver/${driver.driver_number}`)}
                          className={`relative rounded-2xl overflow-hidden cursor-pointer transition-transform hover:-translate-y-2 w-full md:w-1/3 flex-shrink-0 group shadow-2xl ${orderClass} ${isFirst ? 'md:h-[400px] h-80 z-10 md:scale-105' : 'md:h-80 h-72 opacity-95 hover:opacity-100 z-0'}`}
                          style={{
                            background: `linear-gradient(135deg, #${teamColor} 0%, rgba(0,0,0,0.95) 100%)`,
                            borderTop: `4px solid #${teamColor}`
                          }}
                        >
                          <div className="absolute top-6 left-6 z-20">
                            <div className="text-white font-black text-3xl md:text-4xl flex items-baseline gap-1">
                              {driver.position_current}
                              <span className="text-base font-bold opacity-80 uppercase">{
                                driver.position_current === 1 ? 'st' : driver.position_current === 2 ? 'nd' : 'rd'
                              }</span>
                            </div>
                            <div className="text-white font-bold text-xl md:text-2xl leading-tight mt-3">{displayName}</div>
                            <div className="text-gray-300 text-sm md:text-base">{info?.team_name}</div>
                          </div>
                          
                          <div className="absolute bottom-6 left-6 z-20">
                            <div className="text-white font-black text-3xl md:text-4xl">{driver.points_current} <span className="text-sm font-bold opacity-80">PTS</span></div>
                          </div>

                          {photoUrl && (
                            <img 
                              src={photoUrl} 
                              alt={displayName} 
                              className={`absolute bottom-0 right-[-10%] md:right-[-5%] object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105 ${isFirst ? 'h-[85%] md:h-[95%]' : 'h-[75%] md:h-[90%]'}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Remaining Drivers List */}
                <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden mt-8 shadow-lg">
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
                        {restDrivers.map((driver) => {
                          const info = driversMap.get(driver.driver_number);
                          const displayName = info ? info.full_name : `Driver #${driver.driver_number}`;
                          const photoUrl = info?.headshot_url?.replace('1col', '2col');
                          
                          return (
                            <tr 
                              key={driver.driver_number} 
                              onClick={() => router.push(`/driver/${driver.driver_number}`)}
                              className="hover:bg-[#151515] cursor-pointer transition-colors"
                            >
                              <td className="px-6 py-4 font-bold text-gray-400">{driver.position_current}</td>
                              <td className="px-6 py-4 font-medium group flex items-center gap-4">
                                {photoUrl ? (
                                  <img src={photoUrl} alt={displayName} className="w-10 h-10 object-cover rounded-full bg-white/5 border border-white/10" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-gray-500" />
                                  </div>
                                )}
                                <div>
                                  <div className="text-white text-base">{displayName}</div>
                                  <div className="text-gray-500 text-xs">#{driver.driver_number} {info?.team_name ? `• ${info.team_name}` : ''}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right font-semibold text-lg">{driver.points_current}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-gray-500">No driver standings available.</div>
            )}
          </div>
        )}

        {activeTab === "teams" && (
          <div className="space-y-12">
             {loadingTeams ? (
              <div className="p-8 text-center text-gray-500 animate-pulse">Loading constructor standings...</div>
            ) : errTeams ? (
               <div className="p-8 text-center text-[var(--color-f1-red)] flex flex-col items-center gap-2">
                 <ShieldAlert className="w-6 h-6" />
                 Beta endpoint is currently unavailable or returned an error.
               </div>
            ) : teamsStats && teamsStats.length > 0 ? (
              <>
                {/* Team Podium */}
                {top3Teams.length >= 3 && (
                  <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-6 px-2 md:px-4 pt-10">
                    {top3Teams.map((team, index) => {
                      const teamDriver = Array.from(driversMap.values()).find(d => d.team_name === team.team_name);
                      const teamColor = teamDriver?.team_colour || "333333";
                      const isFirst = team.position_current === 1;
                      const carUrl = getTeamCarUrl(team.team_name);
                      const orderClass = index === 0 ? "order-1 md:order-2" : index === 1 ? "order-2 md:order-1" : "order-3 md:order-3";
                      
                      const driversInTeam = Array.from(driversMap.values()).filter(d => d.team_name === team.team_name);

                      return (
                        <div 
                          key={team.team_name} 
                          onClick={() => router.push(`/team/${encodeURIComponent(team.team_name)}`)}
                          className={`relative rounded-2xl overflow-hidden cursor-pointer transition-transform hover:-translate-y-2 w-full md:w-1/3 flex-shrink-0 group shadow-2xl ${orderClass} ${isFirst ? 'md:h-[360px] h-80 z-10 md:scale-105' : 'md:h-80 h-72 opacity-95 hover:opacity-100 z-0'}`}
                          style={{
                            background: `linear-gradient(135deg, #${teamColor} 0%, rgba(0,0,0,0.95) 100%)`,
                            borderTop: `4px solid #${teamColor}`
                          }}
                        >
                          <div className="absolute top-6 left-6 z-20">
                            <div className="text-white font-black text-3xl md:text-4xl flex items-baseline gap-1">
                              {team.position_current}
                              <span className="text-base font-bold opacity-80 uppercase">{
                                team.position_current === 1 ? 'st' : team.position_current === 2 ? 'nd' : 'rd'
                              }</span>
                            </div>
                            <div className="text-white font-bold text-xl md:text-2xl leading-tight mt-3">{team.team_name}</div>
                            <div className="text-white font-black text-2xl md:text-3xl mt-1">{team.points_current} <span className="text-xs font-bold opacity-80">PTS</span></div>
                            
                            <div className="mt-4 space-y-1">
                              {driversInTeam.map(d => (
                                <div key={d.driver_number} className="text-sm text-gray-200">
                                  <span className="font-medium opacity-70">{d.first_name}</span> <span className="font-bold">{d.last_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <img 
                            src={carUrl} 
                            alt={team.team_name} 
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-[95%] object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Remaining Teams Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                  {restTeams.map((team, idx) => {
                    const teamDriver = Array.from(driversMap.values()).find(d => d.team_name === team.team_name);
                    const teamColor = teamDriver?.team_colour || "333333";
                    const carUrl = getTeamCarUrl(team.team_name);
                    const driversInTeam = Array.from(driversMap.values()).filter(d => d.team_name === team.team_name);

                    return (
                      <div 
                        key={team.team_name || idx} 
                        onClick={() => router.push(`/team/${encodeURIComponent(team.team_name)}`)}
                        className="relative rounded-2xl overflow-hidden cursor-pointer transition-transform hover:-translate-y-2 group shadow-xl h-64 md:h-72"
                        style={{
                          background: `linear-gradient(135deg, #${teamColor} 0%, rgba(0,0,0,0.95) 100%)`,
                          borderTop: `4px solid #${teamColor}`
                        }}
                      >
                        <div className="absolute top-6 left-6 z-20">
                          <div className="text-white font-bold text-xl md:text-2xl leading-tight">{team.team_name}</div>
                          
                          <div className="mt-3 flex items-center gap-4">
                            {driversInTeam.map(d => (
                              <div key={d.driver_number} className="flex items-center gap-2">
                                {d.headshot_url && <img src={d.headshot_url.replace('1col', '2col')} className="w-6 h-6 rounded-full object-cover bg-white/10" />}
                                <div className="text-xs text-gray-200">
                                  <span className="opacity-70">{d.first_name}</span> <span className="font-bold uppercase">{d.last_name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="absolute top-6 right-6 z-20 text-right">
                          <div className="text-white font-black text-2xl">{team.points_current} <span className="text-xs font-bold opacity-80">PTS</span></div>
                        </div>
                        
                        <img 
                          src={carUrl} 
                          alt={team.team_name} 
                          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
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
