import { useEffect, useState } from "react";
import { useSettingsStore } from "@/lib/settings-store";
import { en } from "./en";
import { th } from "./th";

const dictionaries = {
  en,
  th,
};

export function useTranslation() {
  const { locale, setLocale } = useSettingsStore();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount
   
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Sync document lang attribute when locale changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const t = (key: string): string => {
    // Fallback to English if translation is missing or not mounted (for SSR)
    const dict = mounted ? dictionaries[locale] : dictionaries["en"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (dict as any)[key] || (dictionaries["en"] as any)[key] || key;
  };

  return { t, locale, setLocale, isReady: mounted };
}
