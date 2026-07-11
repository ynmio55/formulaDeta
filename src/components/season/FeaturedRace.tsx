"use client";

import { useTranslation } from "@/i18n/config";
import { Meeting } from "@/lib/openf1/types";
import { formatDateTime, getTimezoneLabel } from "@/lib/date-utils";
import { Calendar, MapPin, Timer } from "lucide-react";
import Link from "next/link";

interface FeaturedRaceProps {
  meeting: Meeting;
  round: number;
}

export default function FeaturedRace({ meeting, round }: FeaturedRaceProps) {
  const { t } = useTranslation();
  
  return (
    <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-strong)] rounded-2xl overflow-hidden relative mb-8 group">
      {/* Decorative Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-f1-red-hover)]"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-f1-red-hover)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold text-[var(--color-f1-red)] uppercase tracking-widest bg-[var(--color-f1-red)]/10 px-2 py-1 rounded-sm border border-[var(--color-f1-red)]/20">
              {t("season.featured.nextRace")}
            </span>
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider tabular-nums">
              {t("season.round")} {String(round).padStart(2, '0')}
            </span>
          </div>
          
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight">
            {meeting.meeting_official_name}
          </h2>
          
          <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm md:text-base mt-4">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {meeting.circuit_short_name}, {meeting.country_name}
            </div>
            <div className="hidden md:block text-[#444]">&bull;</div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className="tabular-nums">
                {formatDateTime(meeting.date_start, "d MMM")} – {formatDateTime(meeting.date_end, "d MMM yyyy")}
              </span>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5" />
            {getTimezoneLabel(meeting.circuit_short_name)}
          </div>
        </div>
        
        <div className="w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-[var(--color-border-subtle)] pt-6 md:pt-0 md:pl-8 flex flex-col justify-center">
           <Link href={`/meeting?key=${meeting.meeting_key}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-white text-black hover:bg-gray-200 h-10 px-8 py-2 w-full md:w-auto">
             {t("action.details")}
           </Link>
        </div>
      </div>
    </div>
  );
}
