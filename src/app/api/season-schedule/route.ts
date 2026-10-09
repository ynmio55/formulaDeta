import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type JolpiRace = {
  season: string;
  round: string;
  raceName: string;
  date: string;
  time?: string;
  Circuit?: {
    circuitName?: string;
    Location?: { locality?: string; country?: string };
  };
};

export async function GET(request: NextRequest) {
  const year = Number(new URL(request.url).searchParams.get("year"));
  const currentYear = new Date().getUTCFullYear();
  if (!Number.isInteger(year) || year < 2023 || year > currentYear + 1) {
    return NextResponse.json({ error: "Invalid season year" }, { status: 400 });
  }

  try {
    // Jolpica race schedules are not OpenF1 meetings. Never assign meeting_key
    // from a Jolpica round: the IDs refer to different systems.
    const upstream = await fetch(`https://api.jolpi.ca/ergast/f1/${year}.json?limit=100`, {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 600 },
      headers: { Accept: "application/json" },
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: "Backup race calendar unavailable" }, { status: 503 });
    }
    const body: unknown = await upstream.json();
    const data = body as { MRData?: { RaceTable?: { Races?: JolpiRace[] } } };
    const races = data?.MRData?.RaceTable?.Races;
    if (!Array.isArray(races)) {
      return NextResponse.json({ error: "Invalid backup calendar response" }, { status: 502 });
    }
    return NextResponse.json({
      source: "Jolpica",
      year,
      races: races.filter(race => /^\d{4}-\d{2}-\d{2}$/.test(race.date)).map(race => ({
        round: Number(race.round),
        name: race.raceName,
        date: race.date,
        time: race.time || null,
        circuit: race.Circuit?.circuitName || "",
        city: race.Circuit?.Location?.locality || "",
        country: race.Circuit?.Location?.country || "",
      })),
    }, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } });
  } catch {
    return NextResponse.json({ error: "Backup calendar timed out or is unreachable" }, { status: 503 });
  }
}
