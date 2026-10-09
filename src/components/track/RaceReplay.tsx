"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, AlertTriangle } from "lucide-react";
import { useDrivers, useSessionDetails } from "@/hooks/openf1";
import { fetchOpenF1 } from "@/lib/openf1/client";
import type { Location, Position, RaceControl, Pit } from "@/lib/openf1/types";

const WINDOW_MS = 60_000;
const MAX_LAG_MS = 3_000;

function nearest(samples: Location[], time: number): Location | null {
  if (!samples.length) return null;
  let left = 0, right = samples.length - 1;
  while (left < right) {
    const mid = (left + right) >>> 1;
    if (Date.parse(samples[mid].date) < time) left = mid + 1;
    else right = mid;
  }
  const next = samples[left];
  const previous = samples[Math.max(0, left - 1)];
  const closest = Math.abs(Date.parse(next.date) - time) < Math.abs(Date.parse(previous.date) - time)
    ? next : previous;
  return Math.abs(Date.parse(closest.date) - time) <= MAX_LAG_MS ? closest : null;
}

export default function RaceReplay({ sessionKey }: { sessionKey: number | null }) {
  const { data: sessions, isLoading: loadingSession } = useSessionDetails(sessionKey || undefined);
  const { data: drivers } = useDrivers(sessionKey || undefined);
  const session = sessions?.[0];
  const start = session ? Date.parse(session.date_start) : NaN;
  const end = session ? Date.parse(session.date_end) : NaN;
  const duration = Number.isFinite(start) && Number.isFinite(end) && end > start ? end - start : 0;
  const [time, setTime] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [locations, setLocations] = useState<Location[]>([]);
  const [outline, setOutline] = useState<Location[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [controls, setControls] = useState<RaceControl[]>([]);
  const [pits, setPits] = useState<Pit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!duration) return;
    const reset = () => { setTime(start); setPlaying(false); };
    reset();
  }, [start, duration, sessionKey]);

  useEffect(() => {
    if (!playing || !duration) return;
    const interval = window.setInterval(() => {
      setTime(current => Math.min(end, (current ?? start) + 100 * speed));
    }, 100);
    return () => window.clearInterval(interval);
  }, [playing, duration, start, end, speed]);

  useEffect(() => {
    if (playing && time !== null && time >= end) setPlaying(false);
  }, [playing, time, end]);

  // Request only the minute currently being played, rather than an entire race.
  const elapsed = Math.max(0, (time ?? start) - start);
  const windowIndex = duration ? Math.floor(elapsed / WINDOW_MS) : 0;
  const windowStart = start + windowIndex * WINDOW_MS;
  const windowEnd = Math.min(end, windowStart + WINDOW_MS);

  useEffect(() => {
    if (!sessionKey || !duration || !Number.isFinite(windowStart) || windowEnd <= windowStart) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const filters = {
      session_key: sessionKey,
      date: { gte: new Date(windowStart).toISOString(), lte: new Date(windowEnd).toISOString() },
    };
    void Promise.all([
      fetchOpenF1("/v1/location", filters),
      fetchOpenF1("/v1/position", filters).catch(() => [] as Position[]),
      fetchOpenF1("/v1/race_control", filters).catch(() => [] as RaceControl[]),
      fetchOpenF1("/v1/pit", filters).catch(() => [] as Pit[]),
    ]).then(([locationData, positionData, controlData, pitData]) => {
      if (cancelled) return;
      setLocations(locationData);
      setPositions(positionData);
      setControls(controlData);
      setPits(pitData);
    }).catch(() => {
      if (!cancelled) {
        setLocations([]);
        setPositions([]);
        setControls([]);
        setPits([]);
        setError("Race position data is unavailable for this time window.");
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [sessionKey, duration, windowStart, windowEnd]);

  // Establish a circuit outline from a bounded sample, not full-session telemetry.
  const outlineDriver = drivers?.[0]?.driver_number;
  useEffect(() => {
    if (!sessionKey || !duration || !outlineDriver) return;
    let cancelled = false;
    setOutline([]);
    const filters = {
      session_key: sessionKey,
      driver_number: outlineDriver,
      date: {
        gte: new Date(start).toISOString(),
        lte: new Date(Math.min(end, start + 180_000)).toISOString(),
      },
    };
    void fetchOpenF1("/v1/location", filters)
      .then(rows => { if (!cancelled) setOutline(rows.filter((_, i) => i % 3 === 0)); })
      .catch(() => { if (!cancelled) setOutline([]); });
    return () => { cancelled = true; };
  }, [sessionKey, duration, start, end, outlineDriver]);

  const grouped = useMemo(() => {
    const map = new Map<number, Location[]>();
    for (const point of locations) {
      const list = map.get(point.driver_number) || [];
      list.push(point);
      map.set(point.driver_number, list);
    }
    for (const points of map.values()) points.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    return map;
  }, [locations]);

  const currentPositions = useMemo(() => {
    const map = new Map<number, number>();
    for (const item of positions) {
      if (Date.parse(item.date) <= (time ?? start)) map.set(item.driver_number, item.position);
    }
    return map;
  }, [positions, time, start]);

  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const width = context.canvas.width, height = context.canvas.height;
    context.clearRect(0, 0, width, height);
    const samples = outline.length >= 10 ? outline :
      [...grouped.values()].find(list => list.length >= 10) || [];
    if (!samples.length) return;
    const xs = samples.map(point => point.x), ys = samples.map(point => point.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const scale = Math.min((width - 96) / Math.max(1, maxX - minX),
      (height - 96) / Math.max(1, maxY - minY));
    const offsetX = (width - (maxX - minX) * scale) / 2;
    const offsetY = (height - (maxY - minY) * scale) / 2;
    const pixel = (point: Location) => ({
      x: offsetX + (point.x - minX) * scale,
      y: height - (offsetY + (point.y - minY) * scale),
    });

    context.beginPath();
    context.lineWidth = 9;
    context.strokeStyle = "#343b47";
    for (const [index, sample] of samples.entries()) {
      const p = pixel(sample);
      if (!index) context.moveTo(p.x, p.y);
      else context.lineTo(p.x, p.y);
    }
    context.stroke();
    context.lineWidth = 3;
    context.strokeStyle = "#d1d5db";
    context.stroke();

    for (const [number, points] of grouped.entries()) {
      const point = nearest(points, time ?? start);
      if (!point) continue;
      const p = pixel(point);
      const driver = drivers?.find(item => item.driver_number === number);
      const color = driver?.team_colour && /^[a-fA-F0-9]{6}$/.test(driver.team_colour)
        ? "#" + driver.team_colour : "#f87171";
      context.beginPath();
      context.fillStyle = color;
      context.arc(p.x, p.y, 11, 0, 2 * Math.PI);
      context.fill();
      context.fillStyle = "#0b0b0b";
      context.font = "bold 10px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(number), p.x, p.y);
    }
  }, [outline, grouped, drivers, time, start]);

  if (!sessionKey) return (
    <p className="rounded-xl border border-[var(--color-border-subtle)] p-8 text-center text-gray-400">
      Select a session to view position replay.
    </p>
  );
  if (loadingSession || !session) return <div role="status" className="h-80 animate-pulse rounded-xl bg-[var(--color-surface-2)]" />;
  if (!duration) return <p className="p-8 text-gray-400">This session has no usable start/end time.</p>;

  const currentTime = time ?? start;
  const recentControls = controls.filter(item => Date.parse(item.date) <= currentTime).slice(-4).reverse();
  const recentPits = pits.filter(item => Date.parse(item.date) <= currentTime).slice(-4).reverse();

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Race Replay</h2>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              Actual location samples · one-minute on-demand windows · missing data is not interpolated across long gaps
            </p>
          </div>
          {loading && <span role="status" className="text-sm text-[var(--color-text-secondary)]">Loading position window…</span>}
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button type="button" aria-label={playing ? "Pause replay" : "Play replay"}
            disabled={loading || !locations.length}
            onClick={() => { if (time !== null && time >= end) setTime(start); setPlaying(v => !v); }}
            className="rounded-lg bg-[var(--color-f1-red)] p-3 text-white disabled:opacity-40">
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <label htmlFor="replay-speed" className="text-xs text-gray-400">Speed</label>
          <select id="replay-speed" value={speed} onChange={event => setSpeed(Number(event.target.value))}
            className="rounded-lg bg-[var(--color-surface-2)] p-2 text-sm">
            <option value={1}>1x</option><option value={2}>2x</option><option value={4}>4x</option>
          </select>
          <span className="ml-auto font-mono text-sm tabular-nums">
            {new Date(currentTime).toLocaleTimeString()} · {Math.floor((currentTime - start) / 1000)}s
          </span>
        </div>
        <label htmlFor="replay-time" className="mb-2 block text-xs text-gray-400">Seek through session</label>
        <input id="replay-time" type="range" min={0} max={Math.floor(duration / 1000)}
          value={Math.min(Math.floor(duration / 1000), Math.max(0, Math.floor((currentTime - start) / 1000)))}
          onChange={event => {setPlaying(false); setTime(start + Number(event.target.value) * 1000);}}
          className="mb-5 w-full accent-red-500" />
        {error && <div role="alert" className="mb-4 flex items-center gap-2 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4" />{error}
        </div>}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[#0a0a0a]">
          <canvas ref={canvas} width={1000} height={560} aria-label="Replay map showing recorded car positions"
            role="img" className="h-full w-full object-contain" />
          {!loading && !locations.length && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
              No position samples for this interval.
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">Replay is not a live broadcast. Only cars with sufficiently recent recorded coordinates are drawn.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-4">
          <h3 className="mb-3 text-sm font-bold">Recorded positions</h3>
          <div className="max-h-64 space-y-2 overflow-y-auto text-xs">
            {[...currentPositions.entries()].sort((a,b) => a[1]-b[1]).map(([number, position]) => (
              <div key={number} className="flex justify-between gap-2">
                <span>{drivers?.find(driver => driver.driver_number === number)?.name_acronym || "#" + number}</span>
                <span className="font-mono">P{position}</span>
              </div>
            ))}
            {!currentPositions.size && <p className="text-gray-500">No positions recorded in this window.</p>}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-4">
          <h3 className="mb-3 text-sm font-bold">Race control events</h3>
          <div className="space-y-2 text-xs">
            {recentControls.map((item, index) => (
              <p key={index} className="border-b border-[var(--color-border-subtle)] pb-2">{item.message}</p>
            ))}
            {!recentControls.length && <p className="text-gray-500">No messages in this window.</p>}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-4">
          <h3 className="mb-3 text-sm font-bold">Pit stops</h3>
          <div className="space-y-2 text-xs">
            {recentPits.map((item, index) => (
              <p key={index} className="flex justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-2">
                <span>Car #{item.driver_number}</span><span>Lap {item.lap_number ?? "—"}</span>
              </p>
            ))}
            {!recentPits.length && <p className="text-gray-500">No pit stops in this window.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
