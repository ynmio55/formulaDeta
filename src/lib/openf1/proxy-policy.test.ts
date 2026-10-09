import { describe, expect, it } from "vitest";
import { validateOpenF1Query, cacheControlFor } from "./proxy-policy";

describe("OpenF1 proxy policy", () => {
  it("accepts comparison operators from the query builder", () => {
    expect(validateOpenF1Query(new URLSearchParams("date%3E=2026-01-01&session_key=latest"))).toBe(true);
  });
  it("rejects unexpected filters and oversized queries", () => {
    expect(validateOpenF1Query(new URLSearchParams("untrusted=value"))).toBe(false);
    expect(validateOpenF1Query(new URLSearchParams("year=" + "x".repeat(2000)))).toBe(false);
  });
  it("keeps live queries fresh", () => {
    expect(cacheControlFor("sessions", new URLSearchParams("meeting_key=latest"))).toContain("s-maxage=5");
  });
  it("caches historical sessions longer", () => {
    expect(cacheControlFor("sessions", new URLSearchParams("meeting_key=12345"))).toContain("s-maxage=86400");
  });
});
