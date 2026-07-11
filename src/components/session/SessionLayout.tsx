import { useSessionDetails } from "@/hooks/openf1";
import { formatDateTime, getTimezoneLabel } from "@/lib/date-utils";
import { useTranslation } from "@/i18n/config";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, Timer, Map, Car, BarChart2, CloudLightning, Radio } from "lucide-react";
import React from "react";

const sessionTabs = [
  { key: "nav.session", href: "/session", icon: Timer, label: "Overview" },
  { key: "nav.compare", href: "/compare", icon: BarChart2, label: "Compare" },
  { key: "nav.track", href: "/track", icon: Map, label: "Track" },
  { key: "nav.strategy", href: "/strategy", icon: Car, label: "Strategy" },
  { key: "nav.weather", href: "/weather", icon: CloudLightning, label: "Weather" },
  { key: "nav.radio", href: "/radio", icon: Radio, label: "Team Radio" },
];

export function SessionLayout({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const sessionKeyStr = searchParams.get("key");
  const sessionKey = sessionKeyStr ? parseInt(sessionKeyStr, 10) : null;
  const pathname = usePathname();
  const { t, isReady } = useTranslation();

  const { data: sessionData } = useSessionDetails(sessionKey || undefined);
  const session = sessionData?.[0];

  // We need meeting to get the country and flag, wait session has country_key?
  // OpenF1 session has country_key, circuit_short_name, session_name
  
  if (!isReady) return null;

  if (!sessionKey) {
    return <div className="w-full max-w-[1920px] mx-auto animate-in fade-in duration-500">{children}</div>;
  }

  return (
    <div className="space-y-6 w-full max-w-[1920px] mx-auto animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 border-b border-[var(--color-border-subtle)] pb-0">
        {session && (
          <div className="flex gap-4 items-center">
             <Link 
               href={`/meeting?key=${session.meeting_key}`} 
               className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors text-sm font-medium"
             >
               <ArrowLeft className="w-4 h-4" /> Back to Meeting
             </Link>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              {session?.session_name || `Session #${sessionKey}`}
            </h1>
            <p className="text-gray-500 mt-2 text-sm flex items-center gap-2">
              {session?.circuit_short_name}
            </p>
          </div>
          {session && (
            <div className="text-left md:text-right">
              <p className="text-sm font-bold text-[var(--color-f1-red)] uppercase tracking-widest bg-[var(--color-f1-red)]/10 px-2 py-1 rounded-sm inline-block border border-[var(--color-f1-red)]/20 shadow-[0_0_10px_rgba(255,24,1,0.1)]">
                {session.session_type}
              </p>
              <p className="text-xs text-gray-500 mt-2 tabular-nums">
                {formatDateTime(session.date_start, "d MMM yyyy • HH:mm", session.gmt_offset)}
                <br/>
                {getTimezoneLabel(session.circuit_short_name)}
              </p>
            </div>
          )}
        </div>

        {/* Horizontal Sub-navigation Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar">
          <div className="flex gap-1 pb-[-1px]">
            {sessionTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.key}
                  href={`${tab.href}?key=${sessionKey}`}
                  className={clsx(
                    "px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 uppercase tracking-widest",
                    isActive 
                      ? "border-[var(--color-f1-red)] text-white bg-[var(--color-surface-2)] shadow-[inset_0_-2px_8px_rgba(255,24,1,0.2)]" 
                      : "border-transparent text-[var(--color-text-tertiary)] hover:text-white hover:bg-[var(--color-surface-1)]"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {t(tab.key) || tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
