"use client";

import { useMeetings } from "@/hooks/openf1";
import { useAppStore } from "@/lib/store";
import { useTranslation } from "@/i18n/config";
import { useState, useMemo } from "react";
import SeasonHeader from "@/components/season/SeasonHeader";
import FeaturedRace from "@/components/season/FeaturedRace";
import RaceCard from "@/components/season/RaceCard";
import RaceTimeline from "@/components/season/RaceTimeline";
import { LayoutGrid, List } from "lucide-react";

export default function SeasonExplorer() {
  const { year } = useAppStore();
  const { data: meetings, isLoading, isError } = useMeetings(year);
  const { t, isReady } = useTranslation();
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");

  // Calculate Rounds and Progress
  const { actualRaces, meetingRoundMap, completedRaces, nextRace } = useMemo(() => {
    if (!meetings || meetings.length === 0) {
      return { actualRaces: [], meetingRoundMap: new Map(), completedRaces: 0, nextRace: null };
    }

    // Sort all meetings by date chronologically
    const sortedMeetings = [...meetings].sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());
    
    // Filter out Pre-season testing to calculate official rounds
    const actualRaces = sortedMeetings.filter(m => !m.meeting_official_name.toLowerCase().includes("testing"));
    
    const roundMap = new Map<number, number>();
    actualRaces.forEach((m, index) => {
      roundMap.set(m.meeting_key, index + 1);
    });

    // Calculate progress
    const now = new Date();
    let completed = 0;
    let nextRaceCandidate = null;

    for (const race of actualRaces) {
      if (race.is_cancelled) continue;
      const raceEnd = new Date(race.date_end);
      if (now > raceEnd) {
        completed++;
      } else if (!nextRaceCandidate) {
        nextRaceCandidate = race;
      }
    }

    return { 
      actualRaces, 
      meetingRoundMap: roundMap, 
      completedRaces: completed,
      nextRace: nextRaceCandidate
    };
  }, [meetings]);

  if (!isReady) return null;

  return (
    <div className="max-w-7xl mx-auto">
      <SeasonHeader 
        completedRaces={completedRaces} 
        totalRaces={actualRaces.filter(r => !r.is_cancelled).length} 
      />

      {/* View Toggle */}
      <div className="flex justify-end mb-6">
        <div className="flex bg-[var(--color-surface-1)] rounded-md border border-[var(--color-border-subtle)] p-1">
          <button 
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === "grid" ? "bg-[var(--color-surface-2)] text-white" : "text-gray-500 hover:text-gray-300"}`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode("timeline")}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === "timeline" ? "bg-[var(--color-surface-2)] text-white" : "text-gray-500 hover:text-gray-300"}`}
            title="Timeline View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          <div className="h-64 bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-2xl animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="bg-[var(--color-f1-red)]/10 border border-[var(--color-f1-red)]/30 text-red-400 rounded-xl p-8 text-center flex flex-col items-center">
          <p className="mb-4">{t("state.error")}</p>
          <button className="bg-[var(--color-f1-red-hover)] text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors">
            {t("state.retry")}
          </button>
        </div>
      ) : !meetings || meetings.length === 0 ? (
        <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] text-gray-400 rounded-xl p-16 text-center text-lg">
          {t("state.noData")}
        </div>
      ) : (
        <div className="space-y-10">
          
          {nextRace && (
            <FeaturedRace meeting={nextRace} round={meetingRoundMap.get(nextRace.meeting_key) || 0} />
          )}

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {meetings.sort((a,b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()).map((meeting) => (
                <RaceCard 
                  key={meeting.meeting_key} 
                  meeting={meeting} 
                  round={meetingRoundMap.get(meeting.meeting_key) || null} 
                />
              ))}
            </div>
          ) : (
            <RaceTimeline 
              meetings={meetings.sort((a,b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())} 
              meetingRoundMap={meetingRoundMap} 
            />
          )}
        </div>
      )}
    </div>
  );
}
