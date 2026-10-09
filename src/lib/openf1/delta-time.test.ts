import { describe, expect, it } from "vitest";
import { elapsedAtDistance, estimateDelta, integrateDistance } from "./delta-time";
import type { CarData } from "./types";

const sample = (speed: number): CarData[] =>
  [0, 5, 10].map(seconds => ({
    date: new Date(Date.UTC(2026, 0, 1, 0, 0, seconds)).toISOString(),
    speed,
  })) as CarData[];

describe("approximate telemetry delta", () => {
  it("integrates positive distance from speed", () => {
    const points = integrateDistance(sample(36));
    expect(points.at(-1)?.distance).toBeCloseTo(100, 5);
  });
  it("interpolates elapsed time at distance", () => {
    expect(elapsedAtDistance([{ distance: 0, seconds: 0 }, { distance: 100, seconds: 10 }], 25)).toBe(2.5);
  });
  it("slow driver has positive delta against fast reference", () => {
    const delta = estimateDelta(sample(100), sample(80), 50);
    expect(delta.length).toBeGreaterThan(1);
    expect(delta.at(-1)?.[1]).toBeGreaterThan(0);
  });
  it("rejects empty telemetry", () => {
    expect(estimateDelta([], sample(100))).toEqual([]);
  });
});
