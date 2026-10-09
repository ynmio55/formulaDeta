import type { CarData } from "./types";

export type DistanceTimePoint = { distance: number; seconds: number };

/** Estimate distance travelled by integrating time-stamped speed samples. */
export function integrateDistance(data: CarData[]): DistanceTimePoint[] {
  if (data.length === 0) return [];
  const sorted = [...data].filter(p => Number.isFinite(Date.parse(p.date)))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (!sorted.length) return [];
  const start = Date.parse(sorted[0].date);
  let distance = 0;
  const points: DistanceTimePoint[] = [{ distance: 0, seconds: 0 }];
  for (let i = 1; i < sorted.length; i++) {
    const dt = (Date.parse(sorted[i].date) - Date.parse(sorted[i - 1].date)) / 1000;
    if (dt <= 0 || dt > 10) continue;
    const speed = Math.max(0, Number(sorted[i].speed) || 0);
    const previousSpeed = Math.max(0, Number(sorted[i - 1].speed) || 0);
    distance += dt * (speed + previousSpeed) / 7.2;
    points.push({ distance, seconds: (Date.parse(sorted[i].date) - start) / 1000 });
  }
  return points;
}

/** Linear interpolation of elapsed time at an estimated distance (metres). */
export function elapsedAtDistance(points: DistanceTimePoint[], distance: number): number | null {
  if (!points.length || distance < 0 || distance > points[points.length - 1].distance) return null;
  let low = 0;
  let high = points.length - 1;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (points[mid].distance < distance) low = mid + 1;
    else high = mid;
  }
  if (low === 0) return points[0].seconds;
  const prev = points[low - 1];
  const next = points[low];
  const span = next.distance - prev.distance;
  if (span <= 0) return next.seconds;
  return prev.seconds + (distance - prev.distance) / span * (next.seconds - prev.seconds);
}

export function estimateDelta(reference: CarData[], comparison: CarData[], stepMetres = 25): [number, number][] {
  const a = integrateDistance(reference);
  const b = integrateDistance(comparison);
  if (!a.length || !b.length || !Number.isFinite(stepMetres) || stepMetres <= 0) return [];
  const end = Math.min(a[a.length - 1].distance, b[b.length - 1].distance);
  const result: [number, number][] = [];
  for (let metres = 0; metres <= end; metres += stepMetres) {
    const ref = elapsedAtDistance(a, metres);
    const cmp = elapsedAtDistance(b, metres);
    if (ref !== null && cmp !== null) result.push([metres, Math.round((cmp - ref) * 1000) / 1000]);
  }
  return result;
}
