"use client";

import { useLatestMeeting, useSessions, useSessionResult, usePitStops, useOvertakes, useWeather } from "@/hooks/openf1";
import { useTranslation } from "@/i18n/config";
import { formatDateTime, getTimezoneLabel } from "@/lib/date-utils";
import { Trophy, Clock, CloudRain, Thermometer, Car, RotateCcw, Activity, ArrowRight, PlayCircle, CheckCircle2, CircleDashed, Map, ChevronRight, Newspaper, Video } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}
import { getF1News, F1NewsItem } from "@/services/newsService";
import { getF1Videos, F1VideoItem } from "@/services/videoService";
import { fetchOpenF1 } from "@/lib/openf1/client";
import { useQuery } from "@tanstack/react-query";

function useAllDrivers(sessionKey?: number) {
  return useQuery({
    queryKey: ["all_drivers", sessionKey || "latest"],
    queryFn: () => fetchOpenF1("/v1/drivers", { session_key: sessionKey || "latest" }),
    enabled: !!sessionKey || sessionKey === undefined,
  });
}
import { NewsCard, NewsCardSkeleton } from "@/components/media/NewsCard";
import { VideoCard, VideoCardSkeleton } from "@/components/media/VideoCard";

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
  
  const [news, setNews] = useState<F1NewsItem[]>([]);
  const [videos, setVideos] = useState<F1VideoItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);

  const meetingKey = latestMeeting?.[0]?.meeting_key;
  const { data: sessions, isLoading: loadingSessions } = useSessions(meetingKey);
  
  const latestSession = sessions ? sessions[sessions.length - 1] : null;
  const sessionKey = latestSession?.session_key;

  const { data: sessionResult, isLoading: loadingResult } = useSessionResult(sessionKey);
  const { data: pitStops, isLoading: loadingPitStops } = usePitStops(sessionKey);
  const { data: overtakes, isLoading: loadingOvertakes } = useOvertakes(sessionKey);
  const { data: weather, isLoading: loadingWeather } = useWeather(sessionKey);
  const { data: allDrivers } = useAllDrivers(sessionKey);

  useEffect(() => {
    setLoadingMedia(true);
    Promise.all([
      getF1News().catch(() => []),
      getF1Videos().catch(() => [])
    ]).then(([newsData, videosData]) => {
      setNews(newsData);
      setVideos(videosData);
      setLoadingMedia(false);
    });
  }, []);

  const winner = sessionResult?.find(r => r.position === 1);
  const winnerDriver = allDrivers?.find(d => d.driver_number === winner?.driver_number);
  const latestWeather = weather ? weather[weather.length - 1] : null;

  // Live clock — called at top level (Rules of Hooks)
  const liveNow = useLiveClock();
  const meeting = latestMeeting?.[0];
  const trackOffsetHours = meeting?.gmt_offset ? parseInt(meeting.gmt_offset.split(':')[0]) : 0;
  const trackOffsetMins  = meeting?.gmt_offset ? parseInt(meeting.gmt_offset.split(':')[1] || '0') : 0;
  const trackTime = new Date(liveNow.getTime() + (trackOffsetHours * 60 + trackOffsetMins - (-liveNow.getTimezoneOffset())) * 60000);
  const fmtTime = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

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

  if (!meeting) return <div className="text-[var(--color-text-secondary)] p-8 text-center bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)] m-4">{t("state.noData")}</div>;

  return (
    <div className="space-y-6 w-full max-w-[1920px] mx-auto animate-in fade-in duration-700">
      
      {/* 1. HERO COMMAND CENTER */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border-strong)] bg-black h-[280px] md:h-[320px] flex flex-col justify-end p-6 md:p-10 group">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          {/* Dynamic circuit photo — map API country name to F1 CDN name */}
          {(() => {
            const cdnNameMap: Record<string, string> = {
              'United Kingdom': 'Great Britain',
              'UAE': 'Abu Dhabi',
              'United Arab Emirates': 'Abu Dhabi',
              'United States': 'United States',
              'South Korea': 'Korea',
              'Saudi Arabia': 'Saudi Arabia',
            };
            const cdnName = cdnNameMap[meeting.country_name || ''] || meeting.country_name || '';
            const circuitUrl = `https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/2018-redesign-assets/Racehub%20header%20images%2016x9/${encodeURIComponent(cdnName)}.jpg`;
            return (
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105 group-hover:scale-100"
                style={{ backgroundImage: `url('${circuitUrl}')` }}
              />
            );
          })()}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/50 to-black/20 z-10"></div>
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
        {(() => {
          const sessionName = latestSession?.session_name || "";
          const isRace = sessionName.toLowerCase().includes("race") && !sessionName.toLowerCase().includes("sprint");
          const isSprint = sessionName.toLowerCase().includes("sprint");
          const isQualifying = sessionName.toLowerCase().includes("qualifying") || sessionName.toLowerCase().includes("shootout");
          const isPractice = sessionName.toLowerCase().includes("practice");

          const sessionColor = isRace ? "#e8002d"
            : isSprint ? "#ff6600"
            : isQualifying ? "#f5a623"
            : isPractice ? "#4fc3f7"
            : "#888";
          
          const sessionLabel = isRace ? "RACE" : isSprint ? "SPRINT" : isQualifying ? "QUALIFYING" : isPractice ? "PRACTICE" : "SESSION";

          return (
            <Link
              href={sessionKey ? `/session?key=${sessionKey}` : "#"}
              className="bento-card col-span-1 md:col-span-2 p-6 md:p-8 flex flex-col justify-between group relative overflow-hidden block hover:-translate-y-1 transition-all duration-300 hover:shadow-xl"
              style={{ borderTop: `3px solid ${sessionColor}` }}
            >
              {/* Ambient glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-10 transition-opacity duration-500 group-hover:opacity-20" style={{ backgroundColor: sessionColor }} />
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] transition-colors">
                  <Activity className="w-4 h-4" />
                  <h3 className="text-metadata">Current Session</h3>
                </div>
                {latestSession && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: sessionColor }}>Live / Recent</span>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: sessionColor, boxShadow: `0 0 8px ${sessionColor}` }}></span>
                  </div>
                )}
              </div>

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-1 uppercase leading-none">
                    {latestSession?.session_name || "N/A"}
                  </h2>
                  <p className="text-sm font-mono text-[var(--color-text-tertiary)] mb-4">
                    {latestSession ? formatDateTime(latestSession.date_start, "d MMM yyyy", meeting.gmt_offset) : ""}
                  </p>
                </div>


              </div>
            </Link>
          );
        })()}

        {/* P1 Leader (Span 1 or 2) */}
        <div 
           className="bento-card col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-2 p-6 md:p-8 relative overflow-hidden flex flex-col justify-between group shadow-xl transition-all duration-500 hover:-translate-y-1"
           style={winnerDriver ? {
              background: `linear-gradient(135deg, #${winnerDriver.team_colour || '333333'} 0%, rgba(0,0,0,0.95) 100%)`,
              borderTop: `4px solid #${winnerDriver.team_colour || '333333'}`
           } : {}}
        >
          <div className="absolute -bottom-10 -right-5 text-[150px] md:text-[200px] font-bold italic text-white/[0.05] leading-none z-0 select-none group-hover:scale-110 transition-all duration-700">
            {winner?.driver_number || "P1"}
          </div>
          
          {winnerDriver?.headshot_url && (
            <img 
              src={winnerDriver.headshot_url.replace('1col', '9col')} 
              alt={winnerDriver.full_name} 
              className="absolute right-[-10%] md:right-[5%] bottom-0 h-[80%] md:h-[95%] object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] z-0 transition-transform duration-500 group-hover:scale-105"
            />
          )}

          <div className="relative z-10 flex items-center gap-2 text-white/80 mb-6 group-hover:text-white transition-colors">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Current Leader</h3>
          </div>
          <div className="relative z-10 mt-auto">
            {loadingResult ? (
              <div className="h-10 bg-[var(--color-surface-2)] rounded w-1/2 animate-pulse"></div>
            ) : winnerDriver ? (
               <div className="flex flex-col">
                 <span className="text-lg md:text-xl font-medium text-white leading-none">{winnerDriver.first_name}</span>
                 <span className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none mt-1">{winnerDriver.last_name}</span>
                 <span className="text-sm md:text-base font-medium text-white/80 mt-2">{winnerDriver.team_name}</span>
               </div>
            ) : winner ? (
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1">Driver Number</span>
                <span className="text-6xl md:text-7xl font-bold text-white italic tracking-tighter">#{winner.driver_number}</span>
              </div>
            ) : (
              <p className="text-2xl text-white/50 italic">Awaiting Results</p>
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
        
        {/* Circuit Analytics Card (Span 2) — full circuit photo */}
        <div className="col-span-1 md:col-span-3 lg:col-span-4 xl:col-span-2 row-span-2 relative overflow-hidden group min-h-[300px] rounded-xl border border-[var(--color-border-subtle)] cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500">
          
          {/* Circuit photo background */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url('https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/2018-redesign-assets/Racehub%20header%20images%2016x9/${encodeURIComponent(({'United Kingdom':'Great Britain','UAE':'Abu Dhabi','United Arab Emirates':'Abu Dhabi','South Korea':'Korea'}[meeting.country_name||'']||meeting.country_name||''))}.jpg')` }}
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20 z-0" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent z-0" />

          {/* Content */}
          <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 md:p-8">
            {/* Top row: label + flag */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white/80 uppercase tracking-widest">Circuit Analytics</span>
              {meeting.country_flag && (
                <img src={meeting.country_flag} alt="flag" className="w-8 h-5 object-cover rounded-sm shadow-md" />
              )}
            </div>
            
            {/* Middle: circuit name big */}
            <div>
              <p className="text-white/60 text-xs uppercase tracking-widest mb-1">{meeting.country_name}</p>
              <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-none drop-shadow-lg">
                {meeting.circuit_short_name}
              </h3>
              <p className="text-white/70 text-sm mt-2 font-medium">Live telemetry, track positions &amp; sector times</p>
            </div>

            {/* Bottom: CTA button */}
            <div>
              {sessionKey ? (
                <Link 
                  href={`/track?key=${sessionKey}`} 
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[var(--color-f1-red)] hover:text-white transition-colors shadow-lg"
                >
                  <Map className="w-4 h-4" /> Open Track Map <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <button disabled className="inline-flex items-center gap-2 px-5 py-2.5 bg-black/50 text-white/40 rounded-lg text-xs font-bold uppercase tracking-widest cursor-not-allowed backdrop-blur-md">
                  <Map className="w-4 h-4" /> Not Available
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Latest Media Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        {/* Latest News */}
        <section>
          <div className="flex justify-between items-end mb-6 border-b border-[var(--color-border-subtle)] pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-[var(--color-f1-red)]"/> Latest News
            </h2>
            <Link href="/news" className="text-sm text-[var(--color-f1-red)] hover:text-white transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3"/>
            </Link>
          </div>
          
          {loadingMedia ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <NewsCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {news.slice(0, 4).map(article => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>

        {/* Latest Videos */}
        <section>
          <div className="flex justify-between items-end mb-6 border-b border-[var(--color-border-subtle)] pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Video className="w-5 h-5 text-[var(--color-f1-red)]"/> Latest Videos
            </h2>
            <Link href="/video" className="text-sm text-[var(--color-f1-red)] hover:text-white transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3"/>
            </Link>
          </div>
          
          {loadingMedia ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.slice(0, 4).map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
