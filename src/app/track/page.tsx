"use client";

import { useSearchParams } from "next/navigation";
import { useDrivers } from "@/hooks/openf1";
import { fetchOpenF1 } from "@/lib/openf1/client";
import { Location } from "@/lib/openf1/types";
import { useState, useEffect, useRef } from "react";
import { Loader2, Play, Pause, AlertTriangle } from "lucide-react";
import { SessionLayout } from "@/components/session/SessionLayout";
import { Suspense } from "react";
import { useTranslation } from "@/i18n/config";

function TrackPositionContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const sessionKeyStr = searchParams.get("key");
  const sessionKey = sessionKeyStr ? parseInt(sessionKeyStr, 10) : null;
  const { data: drivers } = useDrivers(sessionKey || undefined);
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch some location data for the track visualization
  // Since fetching ALL locations for a session is huge (millions of rows),
  // we limit it by fetching a short time window.
  useEffect(() => {
    if (!sessionKey) return;
    
    const fetchLocations = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch location for a specific driver to draw the track outline,
        // and fetch a slice of time for everyone.
        // For demonstration, we just fetch a small chunk of data.
        // API limitation: no limit parameter, so we fetch for 1 driver to draw track,
        // or just accept we can't load the whole grid without freezing.
        const data = await fetchOpenF1("/v1/location", { 
          session_key: sessionKey,
          driver_number: 1 // Fetch Verstappen to get the track map
        });
        
        // To draw a clean track outline, we don't want the entire 2-hour session (overlapping squiggles).
        // We take a slice of ~10000 points (roughly 1-2 laps at 30Hz) after the car has likely left the pits.
        const startIndex = Math.min(10000, Math.max(0, data.length - 15000));
        const lapData = data.slice(startIndex, startIndex + 15000);
        // Downsample to keep it smooth but performant
        const downsampled = lapData.filter((_, i) => i % 10 === 0);
        setLocations(downsampled);
      } catch (err: any) {
        setError("Beta endpoint is currently unavailable or returned an error.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocations();
  }, [sessionKey]);

  useEffect(() => {
    if (!canvasRef.current || locations.length === 0) return;
    
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Find bounds to normalize
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    locations.forEach(loc => {
      if (loc.x < minX) minX = loc.x;
      if (loc.x > maxX) maxX = loc.x;
      if (loc.y < minY) minY = loc.y;
      if (loc.y > maxY) maxY = loc.y;
    });
    
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    
    const padding = 40;
    const scaleX = (width - padding * 2) / (rangeX || 1);
    const scaleY = (height - padding * 2) / (rangeY || 1);
    const scale = Math.min(scaleX, scaleY);
    
    const offsetX = (width - rangeX * scale) / 2;
    const offsetY = (height - rangeY * scale) / 2;
    
    // Draw track
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
    
    locations.forEach((loc, i) => {
      const px = offsetX + (loc.x - minX) * scale;
      // Invert Y axis because canvas 0,0 is top-left
      const py = height - (offsetY + (loc.y - minY) * scale);
      
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    
    ctx.stroke();
    
    // Reset shadow for the dot
    ctx.shadowBlur = 0;
    
    // Draw a moving dot for demonstration
    // Since we only fetched 1 driver, we just draw the first point.
    if (locations.length > 0) {
      const first = locations[0];
      const px = offsetX + (first.x - minX) * scale;
      const py = height - (offsetY + (first.y - minY) * scale);
      
      ctx.beginPath();
      ctx.fillStyle = "#ef4444";
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
  }, [locations]);

  return (
    <div className="space-y-6">
      {(!sessionKey) ? (
        <div className="text-gray-400 p-8 text-center bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]">
          {t("state.selectSession")}
        </div>
      ) : (
        <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl p-6">
          
          <div className="flex justify-between items-center mb-6">
             <div className="flex gap-2">
               <button className="bg-[var(--color-surface-2)] hover:bg-[var(--color-border-strong)] transition-colors p-2 rounded-md"><Play className="w-4 h-4" /></button>
               <button className="bg-[var(--color-surface-2)] hover:bg-[var(--color-border-strong)] transition-colors p-2 rounded-md"><Pause className="w-4 h-4" /></button>
             </div>
             
             {loading && (
               <div className="flex items-center gap-2 text-sm text-[var(--color-f1-red)] bg-[var(--color-f1-red)]/10 px-3 py-1.5 rounded-md">
                 <Loader2 className="w-4 h-4 animate-spin" /> Fetching map data...
               </div>
             )}
          </div>
          
          <div className="flex items-start gap-2 text-blue-400 bg-blue-500/10 p-3 rounded-md text-sm border border-blue-500/20 mb-6">
            <p><strong>Track Outline:</strong> Displaying a clean sample lap layout. Full live telemetry synchronization requires premium API access.</p>
          </div>

          <div className="aspect-video w-full bg-[#0a0a0a] rounded-lg border border-[var(--color-border-subtle)] overflow-hidden flex items-center justify-center relative">
             <canvas 
               ref={canvasRef} 
               width={800} 
               height={450} 
               className="w-full h-full object-contain"
             />
             {!loading && locations.length === 0 && !error && (
               <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                 No track data available for this session.
               </div>
             )}
             {error && (
               <div className="absolute inset-0 flex items-center justify-center text-[var(--color-f1-red)]">
                 {error}
               </div>
             )}
          </div>
          
        </div>
      )}
    </div>
  );
}

export default function TrackPosition() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]"></div>}>
      <SessionLayout>
        <TrackPositionContent />
      </SessionLayout>
    </Suspense>
  );
}
