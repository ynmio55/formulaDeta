"use client";

import { useCallback, useSyncExternalStore } from "react";

type Kind = "driver" | "team";
const STORAGE_KEY = "formula-data:favorites:v1";
const CHANGE_EVENT = "formula-data:favorites-changed";

function getFavorites(): Record<Kind, string[]> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      driver: Array.isArray(parsed.driver) ? parsed.driver.filter((v: unknown) => typeof v === "string") : [],
      team: Array.isArray(parsed.team) ? parsed.team.filter((v: unknown) => typeof v === "string") : [],
    };
  } catch {
    return { driver: [], team: [] };
  }
}

export function useFavorite(kind: Kind, value: string) {
  const subscribe = useCallback((notify: () => void) => {
    window.addEventListener("storage", notify);
    window.addEventListener(CHANGE_EVENT, notify);
    return () => {
      window.removeEventListener("storage", notify);
      window.removeEventListener(CHANGE_EVENT, notify);
    };
  }, []);
  const getSnapshot = useCallback(() => getFavorites()[kind].includes(value), [kind, value]);
  const favorite = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const toggle = useCallback(() => {
    if (!value) return;
    const current = getFavorites();
    const items = current[kind];
    current[kind] = items.includes(value) ? items.filter(item => item !== value) : [...items, value];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Gracefully handle browsers that block local storage.
    }
  }, [kind, value]);
  return { favorite, toggle };
}
