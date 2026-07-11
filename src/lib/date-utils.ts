import { format, formatInTimeZone } from "date-fns-tz";
import { useSettingsStore } from "./settings-store";

/**
 * Format a UTC date string to the user's selected timezone.
 * @param dateString ISO Date string from API (must be UTC)
 * @param formatStr date-fns format string (e.g., "dd MMM yyyy, HH:mm")
 * @param circuitGmtOffset Optional GMT offset string like "+03:00" to calculate circuit local time.
 */
export function formatDateTime(
  dateString: string | Date | null | undefined,
  formatStr: string,
  circuitGmtOffset?: string | null
): string {
  if (!dateString) return "N/A";
  
  // Zustand store usage outside React component is fine here for simple formatting,
  // but usually it's better to pass the timezone explicitly. We'll use getState().
  const timezonePref = useSettingsStore.getState().timezone;
  
  try {
    const date = new Date(dateString);
    
    // Check for invalid date
    if (isNaN(date.getTime())) return "Invalid Date";

    if (timezonePref === "UTC") {
      return formatInTimeZone(date, "UTC", formatStr);
    } 
    else if (timezonePref === "Asia/Bangkok") {
      return formatInTimeZone(date, "Asia/Bangkok", formatStr);
    } 
    else if (timezonePref === "Circuit" && circuitGmtOffset) {
      // Circuit local time
      // OpenF1 gives offset like "+01:00:00" or "+02:00:00".
      // We can convert this to a timezone format compatible with date-fns-tz
      // Alternatively, just format the time with the static offset.
      const sign = circuitGmtOffset.startsWith("-") ? "-" : "+";
      const match = circuitGmtOffset.match(/(\d{2}):(\d{2})/);
      if (match) {
        const offsetString = `${sign}${match[1]}:${match[2]}`;
        return formatInTimeZone(date, offsetString, formatStr);
      }
      return formatInTimeZone(date, "UTC", formatStr) + " (UTC)";
    } 
    else {
      // Device local time
      return format(date, formatStr);
    }
  } catch (e) {
    return "Invalid Date";
  }
}

/**
 * Helper to get a human-readable timezone label based on the current setting.
 */
export function getTimezoneLabel(circuitName?: string): string {
  const timezonePref = useSettingsStore.getState().timezone;
  const locale = useSettingsStore.getState().locale;

  switch (timezonePref) {
    case "Asia/Bangkok":
      return locale === "th" ? "เวลาไทย (GMT+7)" : "Bangkok Time (GMT+7)";
    case "UTC":
      return "UTC";
    case "Device":
      return locale === "th" ? "เวลาอุปกรณ์" : "Device Local Time";
    case "Circuit":
      return locale === "th" 
        ? `เวลาท้องถิ่น${circuitName ? ` (${circuitName})` : ""}` 
        : `Circuit Local Time${circuitName ? ` (${circuitName})` : ""}`;
    default:
      return "";
  }
}
