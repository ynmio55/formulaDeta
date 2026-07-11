import { useTranslation } from "@/i18n/config";
import { Meeting } from "@/lib/openf1/types";
import { formatDateTime, getTimezoneLabel } from "@/lib/date-utils";
import { MapPin, Flag, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface RaceCardProps {
  meeting: Meeting;
  round: number | null;
}

export default function RaceCard({ meeting, round }: RaceCardProps) {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);

  // Determine status based on dates
  const now = new Date();
  const startDate = new Date(meeting.date_start);
  const endDate = new Date(meeting.date_end);
  
  let statusKey = "season.status.completed";
  let statusColor = "text-white/70 bg-black/50";
  
  if (meeting.is_cancelled) {
    statusKey = "season.status.cancelled";
    statusColor = "text-[var(--color-f1-red)] bg-black/70 border border-[var(--color-f1-red)]/50";
  } else if (now < startDate) {
    statusKey = "season.status.upcoming";
    statusColor = "text-yellow-400 bg-black/60";
  } else if (now >= startDate && now <= endDate) {
    statusKey = "season.status.live";
    statusColor = "text-green-400 bg-black/60 border border-green-500/50";
  }

  // Pre-season check
  const isTesting = !round;
  if (isTesting) {
    statusKey = "season.status.testing";
    statusColor = "text-blue-300 bg-black/60";
  }

  // Image Logic — map by circuit name first, fallback to country name
  const circuitCdnMap: Record<string, string> = {
    // United States (3 circuits)
    'Miami':          'Miami',
    'Austin':         'United States',
    'Las Vegas':      'Las Vegas',
    // Middle East
    'Jeddah':         'Saudi Arabia',
    'Sakhir':         'Bahrain',
    'Yas Marina Circuit': 'Abu Dhabi',
    'Lusail':         'Qatar',
    'Baku':           'Azerbaijan',
    // Europe
    'Spa-Francorchamps': 'Belgium',
    'Hungaroring':    'Hungary',
    'Zandvoort':      'Netherlands',
    'Monza':          'Italy',
    'Imola':          'Emilia Romagna',
    'Catalunya':      'Spain',
    'Madring':        'Spain',
    'Monte Carlo':    'Monaco',
    'Spielberg':      'Austria',
    'Silverstone':    'Great Britain',
    // Americas
    'Interlagos':     'Brazil',
    'Mexico City':    'Mexico',
    'Montreal':       'Canada',
    // Asia-Pacific
    'Suzuka':         'Japan',
    'Shanghai':       'China',
    'Melbourne':      'Australia',
    'Singapore':      'Singapore',
    'Yas Marina':     'Abu Dhabi',
  };
  const countryNameMap: Record<string, string> = {
    'United Kingdom':       'Great Britain',
    'UAE':                  'Abu Dhabi',
    'United Arab Emirates': 'Abu Dhabi',
    'South Korea':          'Korea',
  };

  const circuitKey = meeting.circuit_short_name || '';
  const cdnName = circuitCdnMap[circuitKey]
    ?? countryNameMap[meeting.country_name || '']
    ?? meeting.country_name
    ?? '';

  const defaultImg = `https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/2018-redesign-assets/Racehub%20header%20images%2016x9/${encodeURIComponent(cdnName)}.jpg`;
  const fallbackImg = "/f1_hero_bg.png";
  const bgImg = imgError || isTesting ? fallbackImg : defaultImg;

  return (
    <Link href={`/meeting?key=${meeting.meeting_key}`} className={`block h-[350px] group ${meeting.is_cancelled ? 'opacity-60 grayscale hover:grayscale-0' : ''}`}>
      <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer h-full border border-[var(--color-border-subtle)] hover:border-white/20 group-hover:-translate-y-1">
        
        {/* Background Image Layer */}
        <div 
          className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 ${bgImg === fallbackImg && !isTesting ? 'grayscale opacity-30 mix-blend-screen' : ''}`}
          style={{ backgroundImage: `url('${bgImg}')` }}
        />
        {/* Hidden image just to detect errors silently */}
        {!imgError && !isTesting && (
          <img src={defaultImg} onError={() => setImgError(true)} className="hidden" alt="preload" />
        )}

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/30 to-transparent z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 z-0" />

        {/* Content Layer */}
        <div className="relative z-10 p-6 h-full flex flex-col justify-start">
          
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-black text-white/90 uppercase tracking-widest drop-shadow-md">
              {isTesting ? t("season.preSeason") : `ROUND ${round}`}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm backdrop-blur-md ${statusColor}`}>
              {t(statusKey)}
            </span>
          </div>

          {/* Flag + Country Name */}
          <div className="flex items-center gap-2 mb-1">
            {meeting.country_flag ? (
              <img src={meeting.country_flag} alt="flag" className="w-7 h-5 object-cover rounded-sm shadow-lg shrink-0" />
            ) : (
              <Flag className="w-5 h-5 text-white/70 shrink-0" />
            )}
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase leading-none drop-shadow-lg group-hover:text-[var(--color-f1-red)] transition-colors duration-300 truncate">
              {isTesting ? "Pre-Season Testing" : meeting.country_name}
            </h2>
          </div>

          {/* Circuit Name */}
          <p className="text-white/60 text-xs uppercase tracking-wider mb-2 truncate drop-shadow-sm">
            {meeting.circuit_short_name}
          </p>
          
          <p className="text-white/90 font-bold text-sm md:text-base tracking-wide uppercase drop-shadow-md">
            {formatDateTime(meeting.date_start, "dd", meeting.gmt_offset)} – {formatDateTime(meeting.date_end, "dd MMM", meeting.gmt_offset)}
          </p>

          <div className="mt-auto flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
             <div className="flex items-center justify-between text-xs text-white/70">
                <span className="flex items-center gap-1.5 backdrop-blur-md bg-black/40 px-2 py-1 rounded">
                  <Calendar className="w-3 h-3" /> {getTimezoneLabel(meeting.circuit_short_name)}
                </span>
                <span className="flex items-center text-[var(--color-f1-red)] font-bold uppercase tracking-wider">
                  Details <ChevronRight className="w-3 h-3" />
                </span>
             </div>
          </div>

        </div>
      </div>
    </Link>
  );
}
