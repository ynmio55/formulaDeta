import type { Lap } from "./types";

/**
 * Observed lap-time trend within one tyre stint.
 * Positive = later laps tend to be slower, but this is NOT a causal tyre-degradation
 * estimate because fuel load, traffic, weather and race neutralizations also matter.
 */
export function calculateStintTrend(
  laps: Lap[], driverNumber: number, lapStart: number, lapEnd: number,
): { slope: number; count: number } | null {
  const selected = laps.filter(lap =>
    lap.driver_number === driverNumber &&
    lap.lap_number >= lapStart && lap.lap_number <= lapEnd &&
    !lap.is_pit_out_lap && lap.lap_duration !== null &&
    lap.lap_duration > 20 && lap.lap_duration < 300,
  );
  if (selected.length < 3) return null;
  const sortedDurations = selected.map(lap => lap.lap_duration!).sort((a,b) => a-b);
  const middle = Math.floor(sortedDurations.length / 2);
  const median = sortedDurations.length % 2
    ? sortedDurations[middle] : (sortedDurations[middle - 1] + sortedDurations[middle]) / 2;
  const usable = selected.filter(lap =>
    Math.abs(lap.lap_duration! - median) / median <= 0.15,
  );
  if (usable.length < 3) return null;
  const n = usable.length;
  const meanX = usable.reduce((sum, lap) => sum + lap.lap_number, 0) / n;
  const meanY = usable.reduce((sum, lap) => sum + lap.lap_duration!, 0) / n;
  let covariance = 0, variance = 0;
  for (const lap of usable) {
    covariance += (lap.lap_number - meanX) * (lap.lap_duration! - meanY);
    variance += (lap.lap_number - meanX) ** 2;
  }
  return variance > 0 ? { slope: covariance / variance, count: n } : null;
}
