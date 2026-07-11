"use client";

import { useSearchParams } from "next/navigation";
import { useDrivers } from "@/hooks/openf1";
import { fetchOpenF1 } from "@/lib/openf1/client";
import { TeamRadio } from "@/lib/openf1/types";
import { useState, useEffect } from "react";
import { Radio as RadioIcon, PlayCircle, Loader2, MicOff, WifiOff } from "lucide-react";
import { format } from "date-fns";
import { SessionLayout } from "@/components/session/SessionLayout";
import { Suspense } from "react";
import { useTranslation } from "@/i18n/config";

function TeamRadioContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const sessionKeyStr = searchParams.get("key");
  const sessionKey = sessionKeyStr ? parseInt(sessionKeyStr, 10) : null;
  const { data: drivers } = useDrivers(sessionKey || undefined);
  
  const [radios, setRadios] = useState<TeamRadio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDriver, setSelectedDriver] = useState<number | "all">("all");

  useEffect(() => {
    if (!sessionKey) return;
    
    const fetchRadios = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, string | number> = { session_key: sessionKey };
        if (selectedDriver !== "all") {
          params.driver_number = selectedDriver;
        }
        const data = await fetchOpenF1("/v1/team_radio", params);
        setRadios(data);
      } catch (err: unknown) {
        console.error("Failed to fetch radio messages:", err);
        setError("Failed to load radio messages.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchRadios();
  }, [sessionKey, selectedDriver]);

  if (!sessionKey) {
    return (
      <SessionLayout>
        <div className="text-gray-400 p-8 text-center bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]">
          {t("state.selectSession")}
        </div>
      </SessionLayout>
    );
  }

  const driverMap = new Map();
  if (drivers) {
    drivers.forEach(d => driverMap.set(d.driver_number, d));
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 border-b border-[var(--color-border-subtle)] pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <RadioIcon className="w-8 h-8 text-[var(--color-f1-red)]" />
          Team Radio Communications
        </h1>
        <p className="text-gray-400">Listen to live or historical team radio clips for Session {sessionKey}.</p>
      </header>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Driver Filter */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl p-4 sticky top-6">
            <h3 className="font-semibold mb-3 border-b border-[var(--color-border-subtle)] pb-2 text-sm">Filter by Driver</h3>
            <select 
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="w-full bg-[var(--color-surface-3)] border border-[var(--color-border-strong)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-f1-red)] mb-4"
            >
              <option value="all">All Drivers</option>
              {drivers?.map(d => (
                <option key={d.driver_number} value={d.driver_number}>
                  {d.full_name} (#{d.driver_number})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Radio Feed */}
        <div className="flex-1">
          <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl p-4 min-h-[500px]">
             <div className="flex justify-between items-center mb-4 pb-4 border-b border-[var(--color-border-subtle)]">
               <h3 className="font-semibold">Radio Timeline</h3>
               {loading && (
                 <div className="flex items-center gap-2 text-sm text-[var(--color-f1-red)]">
                   <Loader2 className="w-4 h-4 animate-spin" /> Loading clips...
                 </div>
               )}
             </div>

             {error ? (
               <div className="flex flex-col items-center justify-center py-20 gap-4">
                 <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                   <WifiOff className="w-8 h-8 text-red-500/60" />
                 </div>
                 <p className="text-gray-500 text-sm text-center max-w-xs">ไม่สามารถโหลดข้อมูล Radio ได้<br/>API อาจยังไม่มีข้อมูลสำหรับ session นี้</p>
               </div>
             ) : radios.length === 0 && !loading ? (
               <div className="flex flex-col items-center justify-center py-20 gap-4">
                 <div className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] flex items-center justify-center">
                   <MicOff className="w-8 h-8 text-gray-600" />
                 </div>
                 <div className="text-center">
                   <p className="text-gray-400 font-medium">ไม่พบข้อมูล Radio</p>
                   <p className="text-gray-600 text-sm mt-1">ยังไม่มีคลิปวิทยุทีมสำหรับ Session นี้<br/>หรืออาจเป็นเพราะข้อมูลยังไม่ถูกเผยแพร่</p>
                 </div>
               </div>
             ) : (
               <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                 {radios.map((radio, i) => {
                   const driver = driverMap.get(radio.driver_number);
                   return (
                     <div key={i} className="flex gap-4 p-4 rounded-lg bg-[#151515] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)] transition-colors">
                       <div className="flex flex-col items-center gap-2 shrink-0 w-16">
                         {driver?.headshot_url ? (
                           <img src={driver.headshot_url} alt={driver.name_acronym} className="w-12 h-12 object-cover rounded-full bg-[var(--color-surface-2)]" />
                         ) : (
                           <div className="w-12 h-12 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center font-bold text-gray-500">
                             #{radio.driver_number}
                           </div>
                         )}
                         <span className="text-xs font-medium" style={{ color: driver?.team_colour ? `#${driver.team_colour}` : '#999' }}>
                           {driver?.name_acronym || `#${radio.driver_number}`}
                         </span>
                       </div>
                       <div className="flex-1 flex flex-col justify-center">
                         <div className="flex justify-between items-start mb-2">
                           <span className="text-sm text-gray-400">
                             {format(new Date(radio.date), "HH:mm:ss")} Local Time
                           </span>
                         </div>
                         <audio controls className="w-full h-10 max-w-md custom-audio">
                           <source src={radio.recording_url} type="audio/mpeg" />
                           Your browser does not support the audio element.
                         </audio>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeamRadioDashboard() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]"></div>}>
      <SessionLayout>
        <TeamRadioContent />
      </SessionLayout>
    </Suspense>
  );
}
