import { checkApiRateLimit } from "@/lib/api-rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { getJolpiFallback } from "@/lib/jolpi-fallback";
import { validateOpenF1Query, cacheControlFor } from "@/lib/openf1/proxy-policy";

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
    const rate = await checkApiRateLimit(request);
    if (rate && !rate.allowed) {
      return NextResponse.json({ error: "Too many requests" }, {
        status: 429, headers: { "Retry-After": String(rate.retryAfter), "Cache-Control": "no-store" },
      });
    }
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
    if (!validateOpenF1Query(searchParams)) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }
    
    // Championship endpoints are session-scoped in OpenF1, not year-scoped.
    // For year-based standings pages, use year-aware Jolpi standings directly.
    if (["championship_drivers", "championship_teams"].includes(endpointName) &&
        /^20\d{2}$/.test(searchParams.get("year") || "")) {
      const standings = await getJolpiFallback(endpointName, searchParams);
      if (standings !== null) {
        return NextResponse.json(standings, {
          headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" },
        });
      }
      return NextResponse.json({ error: "Season standings provider unavailable" }, { status: 503 });
    }

    const targetUrl = `${openF1Base}/${endpointName}${queryString ? `?${queryString}` : ""}`;

    // Simple timeout mechanism using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const headers: Record<string, string> = {
      "Accept": "application/json",
    };
    
    // OpenF1 requires short-lived OAuth2 Bearer tokens for subscribed access.
    // Credentials stay on the server and are never returned to the browser.
    const username = process.env.OPENF1_USERNAME;
    const password = process.env.OPENF1_PASSWORD;
    if (username && password) {
      const tokenResponse = await fetch("https://api.openf1.org/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username, password }),
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      });
      if (tokenResponse.ok) {
        const tokenData: unknown = await tokenResponse.json();
        if (typeof tokenData === "object" && tokenData !== null &&
            "access_token" in tokenData && typeof tokenData.access_token === "string") {
          headers.Authorization = `Bearer ${tokenData.access_token}`;
        }
      }
    }

    // Add API key if provided to bypass live session restrictions
    if (!headers.Authorization && process.env.OPENF1_API_KEY) {
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

    if (!res.ok && (res.status === 401 || res.status === 403)) {
      return NextResponse.json({
        error: "OpenF1 access denied. Check OPENF1_API_KEY and the provider subscription for this season.",
        upstreamStatus: res.status,
      }, { status: 503, headers: { "Cache-Control": "no-store" } });
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

    const cacheControl = cacheControlFor(endpointName, searchParams);

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
