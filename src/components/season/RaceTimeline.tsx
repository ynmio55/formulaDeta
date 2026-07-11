"use client";

import { useTranslation } from "@/i18n/config";
import { Meeting } from "@/lib/openf1/types";
import { formatDateTime, getTimezoneLabel } from "@/lib/date-utils";
import Link from "next/link";
import { MapPin } from "lucide-react";

interface RaceTimelineProps {
  meetings: Meeting[];
  meetingRoundMap: Map<number, number>;
}

export default function RaceTimeline({ meetings, meetingRoundMap }: RaceTimelineProps) {
  const { t } = useTranslation();
  const now = new Date();

  return (
    <div className="relative border-l-2 border-[var(--color-border-strong)] ml-4 md:ml-8 py-4 space-y-12">
      {meetings.map((meeting) => {
        const round = meetingRoundMap.get(meeting.meeting_key);
        const isTesting = !round;
        const startDate = new Date(meeting.date_start);
        const endDate = new Date(meeting.date_end);
        
        const isNext = false;
        let isLive = false;
        const isPast = now > endDate;
        
        if (!meeting.is_cancelled && !isTesting) {
           if (now >= startDate && now <= endDate) isLive = true;
           // Ideally, isNext would be passed from parent to avoid recalculating, but this works for styling.
        }

        const dotColor = meeting.is_cancelled ? "bg-[var(--color-f1-red)]/50" : isLive ? "bg-green-500" : isPast ? "bg-[#555]" : "bg-[var(--color-f1-red)]";
        const dotBorder = isLive ? "border-green-400/50" : "border-[#111]";

        return (
          <div key={meeting.meeting_key} className={`relative pl-8 md:pl-12 group ${meeting.is_cancelled ? 'opacity-50' : ''}`}>
            {/* Timeline Dot */}
            <div className={`absolute -left-[9px] top-2 w-4 h-4 rounded-full border-4 ${dotBorder} ${dotColor} transition-colors group-hover:scale-125 z-10`}></div>
            
            <Link href={`/meeting?key=${meeting.meeting_key}`} className="block">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 hover:bg-[var(--color-surface-3)] p-4 -ml-4 rounded-xl transition-colors">
                
                {/* Date Col */}
                <div className="w-32 shrink-0">
                  <div className="text-sm font-semibold text-white tabular-nums">
                    {formatDateTime(meeting.date_start, "d MMM", meeting.gmt_offset)}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                    {isTesting ? t("season.preSeason") : `${t("season.round")} ${String(round).padStart(2, '0')}`}
                  </div>
                </div>

                {/* Details Col */}
                <div className="flex-1">
                   <h3 className="text-lg font-bold text-gray-200 group-hover:text-white transition-colors">
                     {meeting.meeting_official_name}
                   </h3>
                   <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mt-1">
                     <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {meeting.circuit_short_name}</span>
                     <span>&bull;</span>
                     <span className="tabular-nums">{formatDateTime(meeting.date_start, "HH:mm", meeting.gmt_offset)} - {getTimezoneLabel(meeting.circuit_short_name)}</span>
                     {meeting.is_cancelled && (
                       <span className="text-xs font-bold text-[var(--color-f1-red)] ml-2">{t("season.status.cancelled")}</span>
                     )}
                   </div>
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
