export const ALLOWED_QUERY_KEYS = new Set([
  "year", "meeting_key", "session_key", "driver_number", "date", "date_start",
  "date_end", "lap_number", "team_name", "country_name", "circuit_short_name",
  "session_name", "meeting_name", "position", "speed", "rpm", "n_gear",
  "throttle", "brake", "drs", "duration", "pit_duration", "compound",
]);

export const isLiveQuery = (params: URLSearchParams) =>
  params.get("session_key") === "latest" || params.get("meeting_key") === "latest";

export function validateOpenF1Query(params: URLSearchParams): boolean {
  return params.toString().length <= 1800 &&
    [...params.keys()].every(key => ALLOWED_QUERY_KEYS.has(key.replace(/(>=|<=|>|<)$/, "")));
}

export function cacheControlFor(endpoint: string, params: URLSearchParams): string {
  if (isLiveQuery(params)) return "public, max-age=0, s-maxage=5";
  if (["meetings", "sessions", "session_result", "starting_grid"].includes(endpoint)) {
    return "public, max-age=3600, s-maxage=86400";
  }
  if (["car_data", "location"].includes(endpoint)) {
    return "public, max-age=3600, s-maxage=86400";
  }
  return "public, max-age=60, s-maxage=120";
}
