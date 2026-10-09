"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOpenF1 } from "@/lib/openf1/client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Trophy, Newspaper, Star, Award, Flag } from "lucide-react";
import { useEffect, useState } from "react";
import { getF1News, F1NewsItem } from "@/services/newsService";
import { NewsCard, NewsCardSkeleton } from "@/components/media/NewsCard";

function useDriver(driverNumber: string) {
  return useQuery({
    queryKey: ["driver", driverNumber],
    queryFn: () => fetchOpenF1("/v1/drivers", { driver_number: driverNumber }),
  });
}

interface DriverCareerStats {
  wins: number;
  podiums: number;
  poles: number;
  races: number;
  championships: number;
}

function useDriverCareerStats(driverNumber?: number, fullName?: string): { stats: DriverCareerStats | null; loading: boolean } {
  const [stats, setStats] = useState<DriverCareerStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!driverNumber) return;
    
    setLoading(true);

    const fetchStats = async () => {
      try {
        // Match current driver by name first: racing numbers can change across seasons.
        const year = new Date().getUTCFullYear();
        const driverInfoRes = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/drivers.json`);
        const driverInfoData = await driverInfoRes.json();
        let drivers = driverInfoData?.MRData?.DriverTable?.Drivers || [];
        const normalized = fullName?.toLowerCase().trim();
        let driverMatch = drivers.find((d: any) => normalized &&
          `${d.givenName} ${d.familyName}`.toLowerCase() === normalized);
        if (!driverMatch) driverMatch = drivers.find((d: any) => d.permanentNumber === driverNumber.toString());

        if (!driverMatch) {
          const allDriversRes = await fetch(`https://api.jolpi.ca/ergast/f1/drivers.json?limit=1000`);
          const allDriversData = await allDriversRes.json();
          drivers = allDriversData?.MRData?.DriverTable?.Drivers || [];
          driverMatch = drivers.find((d: any) => d.permanentNumber === driverNumber.toString());
        }

        const driverRef = driverMatch?.driverId;

        if (!driverRef) {
          setStats(null);
          return;
        }

        // Step 2: Fetch results, qualifying, standings in parallel
        const [resultsRes, qualiRes, standingsRes] = await Promise.all([
          fetch(`https://api.jolpi.ca/ergast/f1/drivers/${driverRef}/results.json?limit=2000`),
          fetch(`https://api.jolpi.ca/ergast/f1/drivers/${driverRef}/qualifying.json?limit=2000`),
          fetch(`https://api.jolpi.ca/ergast/f1/drivers/${driverRef}/driverstandings.json?limit=200`),
        ]);

        const [resultsData, qualiData, standingsData] = await Promise.all([
          resultsRes.json(),
          qualiRes.json(),
          standingsRes.json(),
        ]);

        const results: any[] = resultsData?.MRData?.RaceTable?.Races || [];
        const qualiRaces: any[] = qualiData?.MRData?.RaceTable?.Races || [];
        const standings: any[] = standingsData?.MRData?.StandingsTable?.StandingsLists || [];

        let wins = 0, podiums = 0;
        results.forEach((race: any) => {
          const pos = parseInt(race.Results?.[0]?.position || '99');
          if (pos === 1) wins++;
          if (pos <= 3) podiums++;
        });

        let poles = 0;
        qualiRaces.forEach((race: any) => {
          const pos = parseInt(race.QualifyingResults?.[0]?.position || '99');
          if (pos === 1) poles++;
        });

        const championships = standings.filter((s: any) =>
          s.DriverStandings?.[0]?.position === '1'
        ).length;

        setStats({ wins, podiums, poles, races: results.length, championships });
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [driverNumber, fullName]);

  return { stats, loading };
}

export default function DriverPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: drivers, isLoading, isError } = useDriver(id);
  const driver = drivers && drivers.length > 0 ? drivers[drivers.length - 1] : undefined;
  const { stats, loading: statsLoading } = useDriverCareerStats(driver?.driver_number, driver?.full_name);

  const [news, setNews] = useState<F1NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    if (driver) {
      setLoadingNews(true);
      getF1News(driver.full_name || driver.last_name)
        .then(data => setNews(data))
        .catch(() => setNews([]))
        .finally(() => setLoadingNews(false));
    }
  }, [driver]);

  if (isLoading) {
    return <div className="p-16 text-center animate-pulse text-gray-500">Loading driver profile...</div>;
  }

  if (isError || !driver) {
    return <div className="p-16 text-center text-red-500">Driver not found.</div>;
  }

  const teamColor = `#${driver.team_colour || '333333'}`;

  const statItems = [
    { label: "Championships", value: stats?.championships ?? "—", icon: Trophy, color: "#f5a623" },
    { label: "Wins", value: stats?.wins ?? "—", icon: Flag, color: "#e8002d" },
    { label: "Podiums", value: stats?.podiums ?? "—", icon: Award, color: "#a78bfa" },
    { label: "Poles", value: stats?.poles ?? "—", icon: Star, color: "#4fc3f7" },
    { label: "Races", value: stats?.races ?? "—", icon: User, color: "#6b7280" },
  ];

  return (
    <div className="w-full max-w-[1920px] mx-auto animate-in fade-in duration-500 space-y-8">
      {/* Hero Header */}
      <header
        className="flex items-end justify-between border-b border-[var(--color-border-subtle)] pb-6 relative overflow-hidden rounded-xl p-8 h-64 md:h-96 shadow-2xl group"
        style={{
          background: `linear-gradient(135deg, ${teamColor} 0%, rgba(0,0,0,0.95) 100%)`,
          borderTop: `4px solid ${teamColor}`
        }}
      >
        <div className="relative z-10 flex flex-col justify-between h-full w-full">
          <button
            onClick={() => router.back()}
            className="text-white/70 hover:text-white flex items-center gap-2 w-fit transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="mt-auto">
            <div className="text-white text-2xl md:text-3xl font-medium leading-none">{driver.first_name}</div>
            <div className="text-white text-5xl md:text-7xl font-black uppercase tracking-tight leading-none mt-1">{driver.last_name}</div>
            <div className="text-white/90 mt-2 text-lg md:text-xl font-medium">{driver.team_name}</div>
            <div className="text-white font-black text-6xl md:text-8xl italic mt-6 opacity-95 tracking-tighter drop-shadow-md">
              {driver.driver_number}
            </div>
          </div>
        </div>

        {driver.headshot_url ? (
          <img
            src={driver.headshot_url.replace('1col', '9col')}
            alt={driver.full_name}
            className="absolute right-[-10%] md:right-[10%] bottom-0 h-[85%] md:h-[95%] object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] z-0 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute top-1/2 -translate-y-1/2 right-16 p-8 opacity-10 z-0">
            <User className="w-48 h-48 md:w-64 md:h-64 text-white" />
          </div>
        )}
      </header>

      {/* Career Stats */}
      <section>
        <h2 className="text-xl font-bold mb-4 border-l-4 pl-3 flex items-center gap-2" style={{ borderColor: teamColor }}>
          <Trophy className="w-5 h-5" style={{ color: teamColor }} /> Career Statistics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {statItems.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl p-5 flex flex-col gap-3 hover:border-[var(--color-border-strong)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">{label}</span>
              </div>
              {statsLoading ? (
                <div className="h-8 w-12 bg-[var(--color-surface-2)] rounded animate-pulse" />
              ) : (
                <span className="text-3xl font-black text-white tabular-nums">{value}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Driver News Section */}
      <section>
        <h2 className="text-xl font-bold mb-6 border-l-4 border-[var(--color-f1-red)] pl-3 flex items-center gap-2">
          <Newspaper className="w-5 h-5"/> Latest News for {driver.last_name}
        </h2>
        
        {loadingNews ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        ) : news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {news.slice(0, 8).map(article => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center text-gray-500 bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]">
            ยังไม่มีข่าวสำหรับนักแข่งคนนี้ (No recent news found for {driver.full_name})
          </div>
        )}
      </section>
    </div>
  );
}
