import { NextResponse } from "next/server";

// Liveness only: no API keys, build information, or third-party data exposed.
export function GET() {
  return NextResponse.json(
    { status: "ok", service: "formula-data" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
