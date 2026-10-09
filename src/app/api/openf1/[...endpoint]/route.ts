import { NextRequest, NextResponse } from "next/server";
import { getJolpiFallback } from "@/lib/jolpi-fallback";

// We require the endpoint to be exactly one of the allowed 18 endpoints
const ALLOWED_ENDPOINTS = new Set([
  "car_data",
  "championship_drivers",
  "championship_teams",
  "drivers",
  "intervals",
  "laps",
  "location",
  "meetings",
  "overtakes",
  "pit",
  "position",
  "race_control",
  "sessions",
  "session_result",
  "starting_grid",
  "stints",
  "team_radio",
  "weather",
]);

const ALLOWED_QUERY_KEYS = new Set([
  "year", "meeting_key", "session_key", "driver_number", "date", "date_start",
  "date_end", "lap_number", "team_name", "country_name", "circuit_short_name",
  "session_name", "meeting_name", "position", "speed", "rpm", "n_gear",
  "throttle", "brake", "drs", "duration", "pit_duration", "compound"
]);
const MAX_QUERY_LENGTH = 1800;
const isLiveQuery = (params: URLSearchParams) =>
  params.get("session_key") === "latest" || params.get("meeting_key") === "latest";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  try {
    const { endpoint } = await params;
    const endpointName = endpoint[0];

    if (endpoint.length !== 1 || !endpointName || !ALLOWED_ENDPOINTS.has(endpointName)) {
      return NextResponse.json(
        { error: "Invalid or unauthorized endpoint" },
        { status: 400 }
      );
    }

    const openF1Base = process.env.OPENF1_API_BASE_URL || "https://api.openf1.org/v1";
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    if (queryString.length > MAX_QUERY_LENGTH ||
        [...searchParams.keys()].some(key => !ALLOWED_QUERY_KEYS.has(key))) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }
    
    const targetUrl = `${openF1Base}/${endpointName}${queryString ? `?${queryString}` : ""}`;

    // Simple timeout mechanism using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const headers: Record<string, string> = {
      "Accept": "application/json",
    };
    
    // Add API key if provided to bypass live session restrictions
    if (process.env.OPENF1_API_KEY) {
      headers["Authorization"] = `Bearer ${process.env.OPENF1_API_KEY}`;
      headers["x-api-key"] = process.env.OPENF1_API_KEY;
    }

    let res: Response;
    try {
      res = await fetch(targetUrl, {
        signal: controller.signal,
        headers,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      // If API returns an error (404 Not Found for beta endpoints, 401/403 blocked, etc.), try Jolpi fallback
      // A fallback is only safe for standings, and must not mask auth/rate-limit errors.
      const fallbackData = [404, 500, 502, 503, 504].includes(res.status) &&
        ["championship_drivers", "championship_teams"].includes(endpointName)
          ? await getJolpiFallback(endpointName, searchParams)
          : null;
      if (fallbackData) {
        return NextResponse.json(fallbackData);
      }

      return NextResponse.json(
        { error: res.status === 429 ? "Upstream rate limit exceeded" : "Upstream API unavailable", upstreamStatus: res.status },
        { status: res.status, headers: {
          "Cache-Control": "no-store",
          ...(res.status === 429 ? { "Retry-After": res.headers.get("retry-after") || "60" } : {})
        }}
      );
    }

    // Proxy the response
    const data = await res.json();

    // Cache historical data (meetings, sessions, results) for a long time
    // Cache live data (telemetry, weather) for a short time
    let cacheControl = "public, max-age=60, s-maxage=120"; // default 1-2 mins
    
    if (!isLiveQuery(searchParams) && ["meetings", "sessions", "session_result", "starting_grid"].includes(endpointName)) {
      cacheControl = "public, max-age=3600, s-maxage=86400"; // 1h browser, 24h CDN
    } else if (["car_data", "location"].includes(endpointName)) {
      // Telemetry might be cached for a long time if it's historical
      const isLatest = isLiveQuery(searchParams);
      if (!isLatest) {
        cacheControl = "public, max-age=3600, s-maxage=86400"; // Historical telemetry never changes
      } else {
        cacheControl = "public, max-age=10, s-maxage=10"; // Short cache for live
      }
    }

    if (isLiveQuery(searchParams)) cacheControl = "public, max-age=0, s-maxage=5";

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": cacheControl,
      },
    });
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Upstream request timeout" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
