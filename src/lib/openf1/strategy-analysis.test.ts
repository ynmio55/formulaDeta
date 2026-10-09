import { describe, expect, it } from "vitest";
import { calculateStintTrend } from "./strategy-analysis";
import type { Lap } from "./types";

function lap(lapNumber: number, duration: number): Lap {
  return {
    driver_number: 1,
    lap_number: lapNumber,
    lap_duration: duration,
    is_pit_out_lap: false,
  } as Lap;
}

describe("measured stint trend", () => {
  it("reports positive seconds per lap for progressively slower laps", () => {
    const result = calculateStintTrend([lap(1, 90), lap(2, 91), lap(3, 92), lap(4, 93)], 1, 1, 4);
    expect(result?.slope).toBeCloseTo(1);
  });
  it("rejects insufficient laps", () => {
    expect(calculateStintTrend([lap(1, 90), lap(2, 91)], 1, 1, 2)).toBeNull();
  });
  it("excludes extreme outliers", () => {
    const result = calculateStintTrend([lap(1, 90), lap(2, 91), lap(3, 250), lap(4, 93)], 1, 1, 4);
    expect(result?.count).toBe(3);
  });
});
