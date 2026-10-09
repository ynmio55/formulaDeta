"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SessionLayout } from "@/components/session/SessionLayout";
import RaceReplay from "@/components/track/RaceReplay";

function ReplayContent() {
  const params = useSearchParams();
  const requested = Number(params.get("key"));
  const sessionKey = Number.isSafeInteger(requested) && requested > 0 ? requested : null;
  return (
    <SessionLayout>
      <RaceReplay sessionKey={sessionKey} />
    </SessionLayout>
  );
}

export default function TrackPosition() {
  return (
    <Suspense fallback={
      <div className="h-64 animate-pulse rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]" />
    }>
      <ReplayContent />
    </Suspense>
  );
}
