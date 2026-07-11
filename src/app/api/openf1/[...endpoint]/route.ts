import { NextRequest, NextResponse } from "next/server";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  try {
    const { endpoint } = await params;
    const endpointName = endpoint[0];

    if (!endpointName || !ALLOWED_ENDPOINTS.has(endpointName)) {
      return NextResponse.json(
        { error: "Invalid or unauthorized endpoint" },
        { status: 400 }
      );
    }

    const openF1Base = process.env.OPENF1_API_BASE_URL || "https://api.openf1.org/v1";
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const targetUrl = `${openF1Base}/${endpointName}${queryString ? `?${queryString}` : ""}`;

    // Simple timeout mechanism using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${res.statusText}` },
        { status: res.status }
      );
    }

    // Proxy the response
    const data = await res.json();

    // Cache historical data (meetings, sessions, results) for a long time
    // Cache live data (telemetry, weather) for a short time
    let cacheControl = "public, max-age=60, s-maxage=120"; // default 1-2 mins
    
    if (["meetings", "sessions", "session_result", "starting_grid"].includes(endpointName)) {
      cacheControl = "public, max-age=3600, s-maxage=86400"; // 1h browser, 24h CDN
    } else if (["car_data", "location"].includes(endpointName)) {
      // Telemetry might be cached for a long time if it's historical
      const isLatest = searchParams.get("session_key") === "latest" || searchParams.get("meeting_key") === "latest";
      if (!isLatest) {
        cacheControl = "public, max-age=3600, s-maxage=86400"; // Historical telemetry never changes
      } else {
        cacheControl = "public, max-age=10, s-maxage=10"; // Short cache for live
      }
    }

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
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
