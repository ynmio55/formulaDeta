"use client";

import { useMeetings, useSessions } from "@/hooks/openf1";
import { formatDateTime, getTimezoneLabel } from "@/lib/date-utils";
import { ArrowLeft, Clock, MapPin, Search, Newspaper } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getF1News, F1NewsItem } from "@/services/newsService";
import { NewsCard, NewsCardSkeleton } from "@/components/media/NewsCard";

function MeetingContent() {
  const searchParams = useSearchParams();
  const meetingKeyStr = searchParams.get("key");
  const meetingKey = meetingKeyStr ? parseInt(meetingKeyStr, 10) : null;
  
  // Actually we need to fetch all meetings and find this one since there isn't a direct get-by-id hook yet, 
  // but we can query by meeting_key in our hook. Wait, our `useMeetings` hook takes `year`. 
  // Let's just use the `useSessions` hook to get sessions for the meeting, and we can fetch the meeting details specifically.
  // We'll update the hook or just use `fetchOpenF1` directly with `useQuery`.
  
  const { data: sessions, isLoading: sessionsLoading } = useSessions(meetingKey || undefined);
  
  const [news, setNews] = useState<F1NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      setLoadingNews(true);
      // Fetch news related to the circuit or meeting name
      getF1News(sessions[0].circuit_short_name || 'Grand Prix')
        .then(data => setNews(data))
        .catch(() => setNews([]))
        .finally(() => setLoadingNews(false));
    }
  }, [sessions]);

  if (!meetingKey) {
    return <div className="text-gray-400">Please select a meeting from the Season Explorer.</div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <Link href="/season" className="text-gray-500 hover:text-white flex items-center gap-2 w-fit transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Season
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meeting Details</h1>
          <p className="text-gray-400 mt-2">Meeting Key: {meetingKey}</p>
        </div>
      </header>

      {sessionsLoading ? (
        <div className="animate-pulse space-y-4">
           <div className="h-12 bg-[var(--color-surface-2)] rounded-lg"></div>
           <div className="h-12 bg-[var(--color-surface-2)] rounded-lg"></div>
           <div className="h-12 bg-[var(--color-surface-2)] rounded-lg"></div>
        </div>
      ) : (
        <section>
          <h2 className="text-xl font-semibold mb-4 border-l-4 border-red-600 pl-3">Sessions</h2>
          <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden shadow-sm">
            {sessions && sessions.length > 0 ? (
              <div className="divide-y divide-[#222]">
                {sessions.map((session) => (
                  <Link 
                    href={`/session?key=${session.session_key}`} 
                    key={session.session_key}
                    className="flex items-center justify-between p-4 hover:bg-[var(--color-surface-3)] transition-colors group"
                  >
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-[var(--color-f1-red)] transition-colors">{session.session_name}</h4>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                         <Clock className="w-3.5 h-3.5" />
                        {formatDateTime(session.date_start, "EEEE, MMM d, yyyy • HH:mm", session.gmt_offset)} <span className="text-xs bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded ml-1">{getTimezoneLabel(session.circuit_short_name)}</span>
                      </p>
                    </div>
                    <div className="text-gray-600 group-hover:text-white transition-colors">
                      View details →
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No sessions found for this meeting.</div>
            )}
          </div>
        </section>
      )}

      {/* Meeting News Section */}
      <section className="pt-8">
        <h2 className="text-xl font-bold mb-6 border-l-4 border-[var(--color-f1-red)] pl-3 flex items-center gap-2">
          <Newspaper className="w-5 h-5"/> Related News
        </h2>
        
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
