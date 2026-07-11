"use client";

import { useSettingsStore, Locale, Timezone } from "@/lib/settings-store";
import { Globe, Clock } from "lucide-react";
import { useLatestMeeting } from "@/hooks/openf1";
import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n/config";
import { GlobalSearch } from "./GlobalSearch";

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function TopBar() {
  const { locale, setLocale, timezone, setTimezone } = useSettingsStore();
  const { t, isReady } = useTranslation();
  const { data: latestMeeting } = useLatestMeeting();
  
  const liveNow = useLiveClock();
  const meeting = latestMeeting?.[0];
  const trackOffsetHours = meeting?.gmt_offset ? parseInt(meeting.gmt_offset.split(':')[0]) : 0;
  const trackOffsetMins  = meeting?.gmt_offset ? parseInt(meeting.gmt_offset.split(':')[1] || '0') : 0;
  const trackTime = new Date(liveNow.getTime() + (trackOffsetHours * 60 + trackOffsetMins - (-liveNow.getTimezoneOffset())) * 60000);
  const fmtTime = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (!isReady) return null; // Avoid hydration mismatch

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-[#0a0a0a] border-b border-[var(--color-border-subtle)] px-4 md:px-8 py-3 mb-6 gap-4 sticky top-0 z-50">
      <div className="flex-1 w-full sm:w-auto flex items-center gap-4">
        {/* Brand Name on the left next to Sidebar */}
        <div className="hidden md:flex items-center">
          <h2 className="text-xl font-bold tracking-tight text-white leading-tight flex items-center gap-1">
            Formula<span className="text-[var(--color-f1-red)] font-normal">Deta</span>
          </h2>
        </div>
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-4">
        {/* Clock Section */}
        {meeting && (
          <div className="hidden md:flex items-center gap-4 pr-4 border-r border-[var(--color-border-strong)]">
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">My Time</span>
                <span className="text-sm font-mono font-bold text-white tabular-nums">{fmtTime(liveNow)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">Track Time</span>
                <span className="text-sm font-mono font-bold tabular-nums text-[var(--color-f1-red)]">{fmtTime(trackTime)}</span>
              </div>
            </div>
            {/* Analog TAG Heuer Clock */}
            <div className="relative w-10 h-10 shrink-0 rounded-full shadow-lg border border-transparent flex items-center justify-center bg-black overflow-hidden">
              <img src="/tag_heuer_clock.png" alt="TAG Heuer Clock" className="absolute inset-0 w-full h-full object-cover z-0" />
              <div className="relative z-10 w-full h-full pointer-events-none drop-shadow-sm">
                <div className="absolute bg-[#e0e0e0] rounded-full origin-bottom" style={{ width: '2px', height: '24%', left: 'calc(50% - 1px)', bottom: '50%', transform: `rotate(${trackTime.getHours() * 30 + trackTime.getMinutes() * 0.5}deg)` }} />
                <div className="absolute bg-white rounded-full origin-bottom" style={{ width: '1.5px', height: '36%', left: 'calc(50% - 0.75px)', bottom: '50%', transform: `rotate(${trackTime.getMinutes() * 6}deg)` }} />
                <div className="absolute bg-[#e8002d] rounded-full origin-bottom" style={{ width: '1px', height: '42%', left: 'calc(50% - 0.5px)', bottom: '50%', transform: `rotate(${trackTime.getSeconds() * 6}deg)` }} />
                <div className="absolute bg-[#1a1a1a] rounded-full" style={{ width: '3px', height: '3px', top: 'calc(50% - 1.5px)', left: 'calc(50% - 1.5px)' }} />
              </div>
            </div>
          </div>
        )}

        {/* Timezone Selector */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value as Timezone)}
            className="bg-[var(--color-surface-1)] border border-[var(--color-border-strong)] rounded-md px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-[var(--color-f1-red)] transition-colors"
          >
            <option value="Asia/Bangkok">{t("timezone.bangkok")}</option>
            <option value="UTC">{t("timezone.utc")}</option>
            <option value="Circuit">{t("timezone.circuit")}</option>
            <option value="Device">{t("timezone.device")}</option>
          </select>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="bg-[var(--color-surface-1)] border border-[var(--color-border-strong)] rounded-md px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-[var(--color-f1-red)] transition-colors"
          >
            <option value="th">ไทย</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </div>
  );
}
