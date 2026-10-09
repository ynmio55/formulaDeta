import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_POINTS = 500;

/**
 * Bounded, server-side telemetry extraction for a single lap.
 * We accept neither arbitrary upstream paths nor unbounded time windows.
 */
export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const sessionKey = Number(params.get("session_key"));
  const driverNumber = Number(params.get("driver_number"));
  const startRaw = params.get("start");
  const endRaw = params.get("end");
  const start = startRaw ? Date.parse(startRaw) : NaN;
  const end = endRaw ? Date.parse(endRaw) : NaN;

  if (!Number.isSafeInteger(sessionKey) || sessionKey <= 0 ||
      !Number.isSafeInteger(driverNumber) || driverNumber <= 0 || driverNumber > 999 ||
      !Number.isFinite(start) || !Number.isFinite(end) ||
      end <= start || end - start > 240_000) {
    return NextResponse.json({ error: "Invalid telemetry interval" }, { status: 400 });
  }

  const query = new URLSearchParams();
  query.set("session_key", String(sessionKey));
  query.set("driver_number", String(driverNumber));
  query.set("date>=", new Date(start).toISOString());
  query.set("date<=", new Date(end).toISOString());

  const origin = process.env.OPENF1_API_BASE_URL || "https://api.openf1.org/v1";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (process.env.OPENF1_API_KEY) {
    headers.Authorization = `Bearer ${process.env.OPENF1_API_KEY}`;
    headers["x-api-key"] = process.env.OPENF1_API_KEY;
  }

  try {
    const response = await fetch(`${origin}/car_data?${query.toString()}`, {
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: response.status === 429 ? "Upstream rate limit exceeded" : "Telemetry unavailable" },
        {
          status: response.status,
          headers: response.status === 429
            ? { "Retry-After": response.headers.get("retry-after") || "60", "Cache-Control": "no-store" }
            : { "Cache-Control": "no-store" },
        },
      );
    }

    const records: unknown = await response.json();
    if (!Array.isArray(records)) {
      return NextResponse.json({ error: "Invalid upstream telemetry data" }, { status: 502 });
    }

    // The upstream interval is capped to four minutes. Retain endpoint samples.
    const stride = Math.max(1, Math.ceil(records.length / MAX_POINTS));
    const sampled = records.filter((_, index) => index % stride === 0);
    if (records.length && sampled[sampled.length - 1] !== records[records.length - 1]) {
      sampled.push(records[records.length - 1]);
    }

    return NextResponse.json(sampled, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=3600" },
    });
  } catch (error) {
    const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      { error: timeout ? "Telemetry request timed out" : "Telemetry request failed" },
      { status: timeout ? 504 : 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
