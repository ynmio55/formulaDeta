"use client";

import { useTranslation } from "@/i18n/config";
import { Meeting } from "@/lib/openf1/types";
import { formatDateTime, getTimezoneLabel } from "@/lib/date-utils";
import { Calendar, MapPin, Timer, ChevronRight } from "lucide-react";
import Link from "next/link";

interface FeaturedRaceProps {
  meeting: Meeting;
  round: number;
}

export default function FeaturedRace({ meeting, round }: FeaturedRaceProps) {
  const { t } = useTranslation();
  const circuitImg = `https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/2018-redesign-assets/Racehub%20header%20images%2016x9/${encodeURIComponent(meeting.country_name || "")}.jpg`;

  return (
    <div className="relative rounded-2xl overflow-hidden mb-8 group h-64 md:h-80 shadow-2xl border border-[var(--color-border-strong)] hover:border-[var(--color-f1-red)]/50 transition-all duration-500">
      
      {/* Circuit Background Photo */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url('${circuitImg}')` }}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-black/20 z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-0" />
      {/* F1 Red top accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-f1-red)] z-20" />

      {/* Content */}
      <div className="absolute inset-0 z-10 p-6 md:p-10 flex flex-col justify-between">
        
        {/* Top: badges */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-white uppercase tracking-widest bg-[var(--color-f1-red)] px-3 py-1.5 rounded-sm shadow-lg">
            {t("season.featured.nextRace")}
          </span>
          <span className="text-xs font-bold text-white/80 uppercase tracking-widest">
            {t("season.round")} {String(round).padStart(2, "0")}
          </span>
          {meeting.country_flag && (
            <img src={meeting.country_flag} alt="flag" className="w-8 h-5 object-cover rounded-sm shadow-md ml-1" />
          )}
        </div>

        {/* Bottom: race name + info + CTA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tight uppercase drop-shadow-lg">
              {meeting.meeting_official_name}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm mt-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {meeting.circuit_short_name}, {meeting.country_name}
              </div>
              <div className="hidden md:block text-white/30">&bull;</div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span className="tabular-nums">
                  {formatDateTime(meeting.date_start, "d MMM")} – {formatDateTime(meeting.date_end, "d MMM yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Timer className="w-3.5 h-3.5" />
                {getTimezoneLabel(meeting.circuit_short_name)}
              </div>
            </div>
          </div>

          <Link
            href={`/meeting?key=${meeting.meeting_key}`}
            className="inline-flex items-center gap-2 whitespace-nowrap px-6 py-3 bg-white text-black rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[var(--color-f1-red)] hover:text-white transition-colors shadow-lg shrink-0"
          >
            {t("action.details")} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
