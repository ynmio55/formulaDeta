"use client";

import { useMeetings, useSessions } from "@/hooks/openf1";
import { formatDateTime, getTimezoneLabel } from "@/lib/date-utils";
import { ArrowLeft, ArrowRight, Clock, MapPin, Search, Newspaper, Activity, Flag } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getF1News, F1NewsItem } from "@/services/newsService";
import { NewsCard, NewsCardSkeleton } from "@/components/media/NewsCard";
import { useTranslation } from "@/i18n/config";

function MeetingContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const meetingKeyStr = searchParams.get("key");
  const meetingKey = meetingKeyStr ? parseInt(meetingKeyStr, 10) : null;
  
  const { data: sessions, isLoading: sessionsLoading } = useSessions(meetingKey || undefined);
  
  const [news, setNews] = useState<F1NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      setLoadingNews(true);
      getF1News(sessions[0].circuit_short_name || 'Grand Prix')
        .then(data => setNews(data))
        .catch(() => setNews([]))
        .finally(() => setLoadingNews(false));
    }
  }, [sessions]);

  if (!meetingKey) {
    return <div className="text-[var(--color-text-tertiary)] p-12 text-center bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]">Please select a meeting from the Season Explorer.</div>;
  }

  const firstSession = sessions?.[0];
  const cdnNameMap: Record<string, string> = {
    'United Kingdom': 'Great Britain',
    'UAE': 'Abu Dhabi',
    'United Arab Emirates': 'Abu Dhabi',
    'South Korea': 'Korea',
    'Saudi Arabia': 'Saudi Arabia',
  };
  const cdnName = firstSession ? (cdnNameMap[firstSession.country_name || ''] || firstSession.country_name || '') : '';
  const circuitUrl = cdnName ? `https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/2018-redesign-assets/Racehub%20header%20images%2016x9/${encodeURIComponent(cdnName)}.jpg` : '';

  return (
    <div className="space-y-12">
      {/* Dynamic Hero Section */}
      <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden group shadow-2xl border border-[var(--color-border-subtle)]">
        {circuitUrl ? (
           <div
             className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105 group-hover:scale-100"
             style={{ backgroundImage: `url('${circuitUrl}')` }}
           />
        ) : (
           <div className="absolute inset-0 bg-[var(--color-surface-2)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/90 via-[#0a0a0a]/50 to-transparent z-10"></div>
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--color-f1-red)] rounded-full blur-[120px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000 z-10"></div>

        <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 md:p-10">
          <Link href="/season" className="text-white/60 hover:text-white flex items-center gap-2 w-fit transition-colors text-sm uppercase tracking-widest font-bold">
            <ArrowLeft className="w-4 h-4" /> {t("meeting.backToSeason")}
          </Link>

          <div>
            {firstSession ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-sm f1-skew shadow-lg">
                    <span className="f1-skew-reverse">ROUND {firstSession.meeting_key}</span>
                  </span>
                  <span className="text-white/80 text-xs md:text-sm font-mono tracking-wider flex items-center gap-2">
                    {firstSession.country_flag && <img src={firstSession.country_flag} alt="flag" className="w-6 h-4 object-cover rounded-sm shadow-md" />}
                    {firstSession.circuit_short_name}
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none drop-shadow-xl">
                  {firstSession.meeting_official_name || firstSession.meeting_name}
                </h1>
                <p className="text-[var(--color-text-tertiary)] font-mono text-sm md:text-base mt-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[var(--color-f1-red)]" /> {firstSession.location}, {firstSession.country_name}
                </p>
              </>
            ) : (
              <h1 className="text-4xl font-black text-white">{t("meeting.details")}</h1>
            )}
          </div>
        </div>
      </div>

      {sessionsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
           {[...Array(6)].map((_, i) => (
             <div key={i} className="h-40 bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]"></div>
           ))}
        </div>
      ) : (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-black uppercase tracking-tight">{t("meeting.sessions")}</h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-[var(--color-f1-red)] to-transparent opacity-20 rounded-full"></div>
          </div>
          
          {sessions && sessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => {
                const sessionName = session.session_name || "";
                const isRace = sessionName.toLowerCase().includes("race") && !sessionName.toLowerCase().includes("sprint");
                const isSprint = sessionName.toLowerCase().includes("sprint");
                const isQualifying = sessionName.toLowerCase().includes("qualifying") || sessionName.toLowerCase().includes("shootout");
                const isPractice = sessionName.toLowerCase().includes("practice");

                const sessionColor = isRace ? "#e8002d"
                  : isSprint ? "#ff6600"
                  : isQualifying ? "#f5a623"
                  : isPractice ? "#4fc3f7"
                  : "#888";
                  
                const now = new Date();
                const startTime = new Date(session.date_start);
                const endTime = new Date(session.date_end);
                // Approximate session duration if date_end is not reliable (sometimes it's just 1 hour)
                // For simplicity, we check if `now` is between start and end.
                const isLive = now >= startTime && now <= endTime;

                return (
                  <Link 
                    href={`/session?key=${session.session_key}`} 
                    key={session.session_key}
                    className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 flex flex-col justify-between group relative overflow-hidden hover:-translate-y-1 transition-all duration-300 shadow-xl hover:shadow-2xl hover:border-white/20"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: `linear-gradient(to bottom, ${sessionColor}, transparent)` }} />
                    <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[50px] opacity-10 transition-opacity duration-500 group-hover:opacity-20 pointer-events-none" style={{ backgroundColor: sessionColor }} />
                    
                    <div className="relative z-10 flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full shadow-lg" style={{ backgroundColor: sessionColor, boxShadow: `0 0 10px ${sessionColor}` }}></div>
                        <h4 className="font-bold text-lg text-white uppercase tracking-widest">{session.session_name}</h4>
                      </div>
                      {isLive && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-red-500/10 rounded border border-red-500/20">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-red-500">Live</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        </div>
                      )}
                    </div>
                    
                    <div className="relative z-10 flex flex-col flex-1">
                      <p className="text-sm font-mono text-[var(--color-text-tertiary)] flex items-center gap-2 mb-6">
                        <Clock className="w-4 h-4 opacity-70" />
                        {formatDateTime(session.date_start, "EEEE, dd MMM yyyy", session.gmt_offset)}
                      </p>
                      
                      <div className="flex items-end justify-between mt-auto pt-4 border-t border-white/5 group-hover:border-white/10 transition-colors">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Local Time</p>
                          <span className="text-3xl font-black font-mono text-white tracking-tighter">
                            {formatDateTime(session.date_start, "HH:mm", session.gmt_offset)}
                          </span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-white text-white/50 group-hover:text-black flex items-center justify-center transition-all duration-300">
                          <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]">
              {t("meeting.noSessions")}
            </div>
          )}
        </section>
      )}

      {/* Meeting News Section */}
      <section className="pt-8">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-[var(--color-f1-red)]"/> {t("meeting.relatedNews")}
          </h2>
          <div className="h-1 flex-1 bg-gradient-to-r from-[var(--color-border-subtle)] to-transparent opacity-50 rounded-full"></div>
        </div>
        
        {loadingNews ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        ) : news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {news.slice(0, 4).map(article => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        ) : !sessionsLoading && (
          <div className="p-16 text-center text-gray-500 bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]">
            ยังไม่มีข่าวสารเกี่ยวกับสนามนี้ (No recent news found for this meeting)
          </div>
        )}
      </section>
    </div>
  );
}

export default function MeetingDetail() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-[var(--color-surface-1)] rounded-xl"></div>}>
      <MeetingContent />
    </Suspense>
  );
}
