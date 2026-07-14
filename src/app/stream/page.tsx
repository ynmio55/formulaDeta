"use client";

import { useSessionDetails } from "@/hooks/openf1";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { useTranslation } from "@/i18n/config";

// Helper to format country name for URL
const formatCountry = (country: string) => {
  const nameMap: Record<string, string> = {
    'great britain': 'great-britain',
    'united kingdom': 'great-britain',
    'united arab emirates': 'abu-dhabi',
    'uae': 'abu-dhabi',
    'saudi arabia': 'saudi-arabia',
    'netherlands': 'netherlands',
  };
  const lower = (country || '').toLowerCase();
  return nameMap[lower] || lower.replace(/\s+/g, '-');
};

// Helper to format session name for URL
const formatSession = (session: string) => {
  const lower = (session || '').toLowerCase();
  if (lower.includes('practice 1')) return 'fp1';
  if (lower.includes('practice 2')) return 'fp2';
  if (lower.includes('practice 3')) return 'fp3';
  if (lower.includes('qualifying')) return 'qualifying';
  if (lower.includes('sprint shootout')) return 'sprint-shootout';
  if (lower.includes('sprint')) return 'sprint';
  if (lower.includes('race')) return 'race';
  return 'race'; // fallback
};

function StreamContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const sessionKeyStr = searchParams.get("key");
  const sessionKey = sessionKeyStr ? parseInt(sessionKeyStr, 10) : null;
  const [iframeKey, setIframeKey] = useState(0);

  const { data: sessionData, isLoading } = useSessionDetails(sessionKey || undefined);
  const session = sessionData?.[0];

  if (sessionKey && (isLoading || !session)) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-[var(--color-f1-red)] rounded-full animate-spin mb-4" />
        <p className="text-[var(--color-text-secondary)] font-mono tracking-widest uppercase">Loading stream data...</p>
      </div>
    );
  }

  const countryName = session ? (session.country_name || session.circuit_short_name || 'Grand Prix') : 'Live';
  const sessionName = session ? session.session_name : 'Motorsports';
  const streamUrl = session ? `https://ppv.st/live/f1/${session.year}/${formatCountry(countryName)}/${formatSession(sessionName)}` : 'https://ppv.st/#35';

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="h-14 bg-black/90 border-b border-white/10 flex items-center justify-between px-4 sm:px-6 z-20 shrink-0">
        <div className="flex items-center gap-4">
          {sessionKey ? (
            <Link 
              href={`/session?key=${sessionKey}`} 
              className="text-white/60 hover:text-white flex items-center gap-2 transition-colors text-xs sm:text-sm font-bold uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          ) : (
            <Link 
              href={`/`} 
              className="text-white/60 hover:text-white flex items-center gap-2 transition-colors text-xs sm:text-sm font-bold uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
          )}
          
          <div className="h-4 w-px bg-white/20 hidden sm:block"></div>
          
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span> Live
            </span>
            <span className="text-white/90 text-sm font-bold uppercase tracking-wide">
              {countryName} • {sessionName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIframeKey(prev => prev + 1)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-md text-xs font-bold uppercase tracking-widest transition-colors"
            title="Reload Stream"
          >
            <RefreshCw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Reload</span>
          </button>
          <a 
            href={streamUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-f1-red)] hover:bg-[var(--color-f1-red-hover)] text-white rounded-md text-xs font-bold uppercase tracking-widest transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" /> <span className="hidden sm:inline">External</span>
          </a>
        </div>
      </div>

      {/* Stream Player Area */}
      <div className="flex-1 w-full bg-[#050505] relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-text-tertiary)] pointer-events-none z-0">
          <div className="w-12 h-12 border-4 border-white/10 border-t-[var(--color-f1-red)] rounded-full animate-spin mb-4" />
          <p className="text-sm font-mono tracking-widest uppercase">Initializing Player...</p>
          <p className="text-xs opacity-50 mt-4 max-w-md text-center px-4">
            If the player fails to load due to browser security (X-Frame-Options), please click the <strong className="text-white">External</strong> button in the top right to open the stream directly.
          </p>
        </div>
        
        <iframe 
          key={iframeKey}
          src={streamUrl} 
          className="w-full h-full relative z-10 border-none"
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        />
      </div>
    </div>
  );
}

export default function StreamPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-[var(--color-f1-red)] rounded-full animate-spin" />
      </div>
    }>
      <StreamContent />
    </Suspense>
  );
}
