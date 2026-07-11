"use client";

import { useTranslation } from "@/i18n/config";
import { Meeting } from "@/lib/openf1/types";
import { formatDateTime, getTimezoneLabel } from "@/lib/date-utils";
import { MapPin, Flag, Calendar } from "lucide-react";
import Link from "next/link";

interface RaceCardProps {
  meeting: Meeting;
  round: number | null;
}

export default function RaceCard({ meeting, round }: RaceCardProps) {
  const { t } = useTranslation();

  // Determine status based on dates
  const now = new Date();
  const startDate = new Date(meeting.date_start);
  const endDate = new Date(meeting.date_end);
  
  let statusKey = "season.status.completed";
  let statusColor = "text-gray-400 bg-gray-500/10";
  
  if (meeting.is_cancelled) {
    statusKey = "season.status.cancelled";
    statusColor = "text-[var(--color-f1-red)] bg-[var(--color-f1-red)]/10";
  } else if (now < startDate) {
    statusKey = "season.status.upcoming";
    statusColor = "text-yellow-500 bg-yellow-500/10";
  } else if (now >= startDate && now <= endDate) {
    statusKey = "season.status.live";
    statusColor = "text-green-500 bg-green-500/10 border-green-500/50";
  }

  // Pre-season check
  const isTesting = !round;
  if (isTesting) {
    statusKey = "season.status.testing";
    statusColor = "text-blue-400 bg-blue-500/10";
  }

  return (
    <Link href={`/meeting?key=${meeting.meeting_key}`} className={`block h-full group ${meeting.is_cancelled ? 'opacity-60 grayscale hover:grayscale-0' : ''}`}>
      <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden hover:border-[var(--color-border-hover)] transition-all cursor-pointer h-full flex flex-col">
        <div className="p-5 flex-1 relative">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              {meeting.country_flag ? (
                 <img src={meeting.country_flag} alt="flag" className="w-6 h-6 rounded-sm object-cover shadow-sm" />
              ) : (
                <div className="w-6 h-6 bg-[var(--color-surface-2)] rounded-sm flex items-center justify-center"><Flag className="w-3 h-3 text-gray-500" /></div>
              )}
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider tabular-nums">
                {isTesting ? t("season.preSeason") : `${t("season.round")} ${String(round).padStart(2, '0')}`}
              </span>
            </div>
            
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${statusColor} ${meeting.is_cancelled ? 'border-[var(--color-f1-red)]/20' : 'border-transparent'}`}>
              {t(statusKey)}
            </span>
          </div>
          
          <h2 className="text-lg font-bold text-gray-100 mb-1 line-clamp-2 leading-tight group-hover:text-white" title={meeting.meeting_official_name}>
            {meeting.meeting_official_name}
          </h2>
          <p className="text-gray-400 text-sm flex items-center gap-1.5 mb-2 mt-3">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{meeting.circuit_short_name} &middot; {meeting.country_name}</span>
          </p>
        </div>
        
        <div className="bg-[#151515] px-5 py-3 border-t border-[var(--color-border-subtle)] text-sm text-gray-400 group-hover:bg-[var(--color-surface-3)] transition-colors">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span className="tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">
                {formatDateTime(meeting.date_start, "d MMM", meeting.gmt_offset)} – {formatDateTime(meeting.date_end, "d MMM yyyy", meeting.gmt_offset)}
              </span>
            </div>
            <div className="text-xs text-gray-500 ml-5.5 truncate" title={getTimezoneLabel()}>
              {getTimezoneLabel(meeting.circuit_short_name)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
