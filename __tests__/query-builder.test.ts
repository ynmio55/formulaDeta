import { describe, it, expect } from "vitest";
import { buildOpenF1Query } from "../src/lib/openf1/query-builder";

describe("OpenF1 Query Builder", () => {
  it("should build basic equality queries", () => {
    const query = buildOpenF1Query({
      session_key: 9159,
      driver_number: 55,
      csv: true
    });
    expect(query).toBe("session_key=9159&driver_number=55&csv=true");
  });

  it("should ignore undefined values", () => {
    const query = buildOpenF1Query({
      session_key: 9159,
      driver_number: undefined,
    });
    expect(query).toBe("session_key=9159");
  });

  it("should build queries with array values", () => {
    const query = buildOpenF1Query({
      driver_number: [1, 16, 55]
    });
    expect(query).toBe("driver_number=1&driver_number=16&driver_number=55");
  });

  it("should handle date values", () => {
    const date = new Date("2023-09-15T13:08:19.923Z");
    const query = buildOpenF1Query({
      date: date
    });
    expect(query).toBe("date=" + encodeURIComponent("2023-09-15T13:08:19.923Z"));
  });

  it("should build queries with complex operators", () => {
    const query = buildOpenF1Query({
      speed: { gte: 315, lt: 330 },
      rpm: { gt: 11000, lte: 12000 }
    });
    expect(query).toBe(
      "speed%3E%3D315&speed%3C330&rpm%3E11000&rpm%3C%3D12000"
    );
  });

  it("should encode URL correctly", () => {
    const query = buildOpenF1Query({
      session_name: "Practice 1",
    });
    expect(query).toBe("session_name=Practice%201");
  });
});
