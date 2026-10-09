"use client";

import { useSyncExternalStore } from "react";

const KEY = "formula-data:recent-sessions:v1";
const EVENT = "formula-data:recent-sessions-changed";

export type RecentSession = {
  key: number;
  name: string;
  circuit: string;
  viewedAt: string;
};

export function recordRecentSession(session: Omit<RecentSession, "viewedAt">) {
  if (!Number.isSafeInteger(session.key) || session.key <= 0) return;
  try {
    const previous = readRecent();
    const updated = [
      { ...session, viewedAt: new Date().toISOString() },
      ...previous.filter(item => item.key !== session.key),
    ].slice(0, 8);
    window.localStorage.setItem(KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Local storage may be disabled by browser policy.
  }
}

function readRecent(): RecentSession[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((entry: unknown): entry is RecentSession => {
      if (!entry || typeof entry !== "object") return false;
      const value = entry as Partial<RecentSession>;
      return Number.isSafeInteger(value.key) && typeof value.name === "string" &&
        typeof value.circuit === "string" && typeof value.viewedAt === "string";
    }).slice(0, 8);
  } catch {
    return [];
  }
}

function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(EVENT, notify);
  };
}

export function useRecentSessions(): RecentSession[] {
  const json = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(KEY) || "[]",
    () => "[]",
  );
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((value: unknown): value is RecentSession => {
      if (!value || typeof value !== "object") return false;
      const item = value as Partial<RecentSession>;
      return typeof item.key === "number" && typeof item.name === "string" &&
        typeof item.circuit === "string" && typeof item.viewedAt === "string";
    }) : [];
  } catch {
    return [];
  }
}
