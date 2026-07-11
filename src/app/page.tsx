"use client";

import { useLatestMeeting, useSessions, useSessionResult, usePitStops, useOvertakes, useWeather } from "@/hooks/openf1";
import { useTranslation } from "@/i18n/config";
import { formatDateTime, getTimezoneLabel } from "@/lib/date-utils";
import { Trophy, Clock, CloudRain, Thermometer, Car, RotateCcw, Activity, ArrowRight, PlayCircle, CheckCircle2, CircleDashed, Map, ChevronRight } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Timeline Component
function RaceWeekendTimeline({ sessions, currentSessionKey, gmtOffset }: { sessions: any[], currentSessionKey: number | null | undefined, gmtOffset: string }) {
  if (!sessions || sessions.length === 0) return null;
  
  return (
    <div className="flex flex-col gap-0 w-full relative">
      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-[var(--color-border-subtle)]"></div>
      
      {sessions.map((session) => {
        const isCurrent = session.session_key === currentSessionKey;
        const isCompleted = currentSessionKey ? session.session_key < currentSessionKey : false;
        
        return (
          <Link 
            key={session.session_key} 
            href={`/session?key=${session.session_key}`}
            className="relative flex items-start gap-6 p-4 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors group"
          >
            {/* Status Node */}
            <div className="relative z-10 flex flex-col items-center mt-1">
              {isCurrent ? (
                <div className="w-8 h-8 rounded-full bg-[var(--color-f1-red)]/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-f1-red)] animate-pulse shadow-[0_0_10px_var(--color-f1-red)]"></div>
                </div>
              ) : isCompleted ? (
                <div className="w-8 h-8 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center border border-[var(--color-border-hover)]">
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--color-surface-1)] flex items-center justify-center border border-[var(--color-border-strong)] group-hover:border-[var(--color-text-tertiary)] transition-colors">
                  <CircleDashed className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-white" />
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={clsx("font-bold truncate text-base transition-colors", isCurrent ? "text-white" : isCompleted ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-tertiary)] group-hover:text-white")}>
                  {session.session_name}
                </h4>
                <div className={clsx("opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1", isCurrent ? "text-[var(--color-f1-red)]" : "text-white")}>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-sm font-mono text-[var(--color-text-tertiary)] mt-1 tracking-tight">
                {formatDateTime(session.date_start, "EEE, dd MMM yyyy • HH:mm", gmtOffset)}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default function OverviewDashboard() {
  const { data: latestMeeting, isLoading: loadingMeeting } = useLatestMeeting();
  const { t, isReady } = useTranslation();
  const { setYear } = useAppStore();
  const router = useRouter();
  
  const meetingKey = latestMeeting?.[0]?.meeting_key;
  const { data: sessions, isLoading: loadingSessions } = useSessions(meetingKey);
  
  const latestSession = sessions ? sessions[sessions.length - 1] : null;
  const sessionKey = latestSession?.session_key;

  const { data: sessionResult, isLoading: loadingResult } = useSessionResult(sessionKey);
  const { data: pitStops, isLoading: loadingPitStops } = usePitStops(sessionKey);
  const { data: overtakes, isLoading: loadingOvertakes } = useOvertakes(sessionKey);
  const { data: weather, isLoading: loadingWeather } = useWeather(sessionKey);

  const winner = sessionResult?.find(r => r.position === 1);
  const latestWeather = weather ? weather[weather.length - 1] : null;

  if (!isReady) return null;

  if (loadingMeeting || loadingSessions) {
    return (
      <div className="space-y-6 animate-pulse w-full max-w-[1920px] mx-auto">
        <div className="h-[280px] md:h-[320px] w-full bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          <div className="col-span-1 md:col-span-2 h-48 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border-subtle)]"></div>
          <div className="col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-2 h-48 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border-subtle)]"></div>
          <div className="col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-1 h-48 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border-subtle)]"></div>
          <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-1 h-48 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border-subtle)]"></div>
          <div className="col-span-1 md:col-span-3 lg:col-span-4 xl:col-span-4 h-[400px] bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border-subtle)]"></div>
        </div>
      </div>
    );
  }

  const meeting = latestMeeting?.[0];
  if (!meeting) return <div className="text-[var(--color-text-secondary)] p-8 text-center bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)] m-4">{t("state.noData")}</div>;

  return (
    <div className="space-y-6 w-full max-w-[1920px] mx-auto animate-in fade-in duration-700">
      
      {/* 1. HERO COMMAND CENTER */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border-strong)] bg-black h-[280px] md:h-[320px] flex flex-col justify-end p-6 md:p-10 group">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <Image src="/f1_hero_bg.png" alt="F1 Background" fill className="object-cover opacity-[0.25] mix-blend-luminosity grayscale group-hover:grayscale-0 transition-all duration-1000" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-base)] via-[var(--color-bg-base)]/80 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-black/80 z-10"></div>
          {/* Abstract F1 Red glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--color-f1-red)] rounded-full blur-[120px] opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>
          {/* Dynamic Speed Lines */}
          <div className="absolute top-1/2 left-1/4 w-[150%] h-[1px] bg-gradient-to-r from-transparent via-[var(--color-f1-red)] to-transparent opacity-20 f1-skew-reverse"></div>
          <div className="absolute top-2/3 right-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-10 f1-skew-reverse"></div>
        </div>

        {/* Content Layer */}
        <div className="relative z-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[var(--color-f1-red)] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm f1-skew flex items-center shadow-[0_0_10px_rgba(255,24,1,0.5)]">
                <span className="f1-skew-reverse">LATEST EVENT</span>
              </span>
              <span className="text-[var(--color-text-secondary)] text-xs md:text-sm font-mono tracking-wider flex items-center gap-2">
                {meeting.country_flag && <img src={meeting.country_flag} alt="flag" className="w-5 h-3.5 object-cover rounded-[2px]" />}
                {meeting.circuit_short_name} • ROUND {meeting.meeting_key}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-white uppercase italic leading-none mb-3">
              {meeting.meeting_official_name}
            </h1>
            <p className="text-[var(--color-text-tertiary)] font-mono text-sm md:text-base">
              {formatDateTime(meeting.date_start, "dd MMM", meeting.gmt_offset)} - {formatDateTime(meeting.date_end, "dd MMM yyyy", meeting.gmt_offset)} <span className="mx-2">|</span> {getTimezoneLabel(meeting.circuit_short_name)}
            </p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => {
                setYear(meeting.year);
                router.push(`/season?year=${meeting.year}`);
              }}
              className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg backdrop-blur-md text-xs md:text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 h-fit"
            >
              Season Explorer
            </button>
            {sessionKey && (
              <Link 
                href={`/session?key=${sessionKey}`}
                className="px-5 py-3 bg-[var(--color-f1-red)] hover:bg-[var(--color-f1-red-hover)] text-white rounded-lg text-xs md:text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(255,24,1,0.3)] h-fit"
              >
                <PlayCircle className="w-5 h-5" /> Live Data
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. ASYMMETRICAL BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        
        {/* Latest Session Card (Span 2) */}
        <div className="bento-card col-span-1 md:col-span-2 p-6 md:p-8 flex flex-col justify-between group relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] -z-10 group-hover:bg-white/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] transition-colors">
              <Activity className="w-4 h-4" />
              <h3 className="text-metadata">Current Session</h3>
            </div>
            {latestSession && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--color-f1-red)] uppercase font-bold tracking-widest">Live / Recent</span>
                <span className="w-2 h-2 rounded-full bg-[var(--color-f1-red)] animate-pulse shadow-[0_0_8px_var(--color-f1-red)]"></span>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2 uppercase group-hover:text-[var(--color-f1-red)] transition-colors">
              {latestSession?.session_name || "N/A"}
            </h2>
            <p className="text-xl md:text-2xl font-mono text-[var(--color-text-secondary)]">
              {latestSession ? formatDateTime(latestSession.date_start, "HH:mm:ss", meeting.gmt_offset) : "--:--:--"}
            </p>
          </div>
        </div>

        {/* P1 Leader (Span 1 or 2) */}
        <div className="bento-card col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-2 p-6 md:p-8 relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute -bottom-10 -right-5 text-[150px] md:text-[200px] font-bold italic text-white/[0.03] leading-none z-0 select-none group-hover:scale-110 group-hover:text-[var(--color-f1-red)]/[0.05] transition-all duration-700">
            {winner?.driver_number || "P1"}
          </div>
          <div className="relative z-10 flex items-center gap-2 text-[var(--color-text-tertiary)] mb-6 group-hover:text-[var(--color-text-secondary)] transition-colors">
            <Trophy className="w-4 h-4" />
            <h3 className="text-metadata">Current Leader</h3>
          </div>
          <div className="relative z-10 mt-auto">
            {loadingResult ? (
              <div className="h-10 bg-[var(--color-surface-2)] rounded w-1/2 animate-pulse"></div>
            ) : winner ? (
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1">Driver Number</span>
                <span className="text-6xl md:text-7xl font-bold text-white italic tracking-tighter">#{winner.driver_number}</span>
              </div>
            ) : (
              <p className="text-2xl text-[var(--color-text-tertiary)] italic">Awaiting Results</p>
            )}
          </div>
        </div>

        {/* Conditions (Span 1) */}
        <div className="bento-card col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-1 p-6 flex flex-col justify-between group hover:bg-[var(--color-surface-2)]">
          <div className="flex items-center gap-2 text-[var(--color-text-tertiary)] mb-6 group-hover:text-[var(--color-text-secondary)] transition-colors">
            <Thermometer className="w-4 h-4" />
            <h3 className="text-metadata">Conditions</h3>
          </div>
          <div className="space-y-5">
            <div>
              <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1">Track Temp</div>
              <div className="text-3xl font-mono text-white tracking-tight">{latestWeather?.track_temperature ? `${latestWeather.track_temperature}°C` : "--"}</div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1">Air Temp</div>
              <div className="text-2xl font-mono text-[var(--color-text-secondary)] tracking-tight">{latestWeather?.air_temperature ? `${latestWeather.air_temperature}°C` : "--"}</div>
            </div>
          </div>
        </div>

        {/* Action Stats (Span 1) */}
        <div className="bento-card col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-1 p-6 flex flex-col justify-between group bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)]">
           <div className="flex items-center gap-2 text-[var(--color-text-tertiary)] mb-6 group-hover:text-[var(--color-text-secondary)] transition-colors">
            <RotateCcw className="w-4 h-4" />
            <h3 className="text-metadata">Action Stats</h3>
          </div>
          <div className="space-y-4">
             <div className="flex items-end justify-between border-b border-[var(--color-border-subtle)] pb-3">
              <span className="text-sm text-[var(--color-text-secondary)]">Pit Stops</span>
              <span className="text-3xl font-mono text-white tracking-tighter">{pitStops ? pitStops.length : "-"}</span>
            </div>
            <div className="flex items-end justify-between border-b border-[var(--color-border-subtle)] pb-3">
              <span className="text-sm text-[var(--color-text-secondary)]">Overtakes</span>
              <span className="text-3xl font-mono text-white tracking-tighter">{overtakes ? overtakes.length : "-"}</span>
            </div>
          </div>
        </div>

        {/* Timeline (Span Full on small, Span 4 on large) */}
        <div className="bento-card col-span-1 md:col-span-3 lg:col-span-4 xl:col-span-4 p-6 row-span-2 min-h-[450px] flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-[var(--color-border-subtle)] pb-4">
            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight uppercase">Race Weekend Timeline</h3>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[var(--color-text-tertiary)] bg-[var(--color-surface-2)] px-3 py-1.5 rounded-full border border-[var(--color-border-strong)]">
              {getTimezoneLabel(meeting.circuit_short_name)}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 -mr-4 relative">
            {sessions ? (
              <RaceWeekendTimeline sessions={sessions} currentSessionKey={sessionKey} gmtOffset={meeting.gmt_offset} />
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--color-text-tertiary)] animate-pulse">Loading schedule...</div>
            )}
          </div>
        </div>
        
        {/* Track / Weather Minimap placeholder (Span 2) */}
        <div className="bento-card col-span-1 md:col-span-3 lg:col-span-4 xl:col-span-2 p-0 row-span-2 bg-[var(--color-surface-2)] relative overflow-hidden group min-h-[300px]">
          {/* Faux grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface-1)] via-transparent to-transparent z-0"></div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-[var(--color-border-hover)]">
              <Map className="w-8 h-8 text-[var(--color-text-secondary)] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Circuit Analytics</h3>
            <p className="text-sm text-[var(--color-text-tertiary)] mb-8 max-w-[200px]">Live telemetry, track positions, and sector times.</p>
            
            {sessionKey ? (
              <Link href={`/track?key=${sessionKey}`} className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[var(--color-f1-red)] hover:text-white transition-colors">
                Open Track Map <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <button disabled className="px-6 py-3 bg-[var(--color-surface-3)] text-[var(--color-text-tertiary)] rounded-lg text-sm font-bold uppercase tracking-widest cursor-not-allowed">
                Not Available
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
