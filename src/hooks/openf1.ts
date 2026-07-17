"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOpenF1 } from "@/lib/openf1/client";
import { QueryParams } from "@/lib/openf1/query-builder";

export function useMeetings(year?: number) {
  return useQuery({
    queryKey: ["meetings", year],
    queryFn: () => fetchOpenF1("/v1/meetings", year ? { year } : {}),
  });
}

export function useLatestMeeting() {
  return useQuery({
    queryKey: ["meetings", "latest"],
    queryFn: () => fetchOpenF1("/v1/meetings", { meeting_key: "latest" }),
  });
}

export function useSessions(meetingKey?: number | "latest") {
  return useQuery({
    queryKey: ["sessions", meetingKey],
    queryFn: () => fetchOpenF1("/v1/sessions", { meeting_key: meetingKey! }),
    enabled: !!meetingKey,
  });
}

export function useSessionDetails(sessionKey?: number) {
  return useQuery({
    queryKey: ["session_details", sessionKey],
    queryFn: () => fetchOpenF1("/v1/sessions", { session_key: sessionKey! }),
    enabled: !!sessionKey,
  });
}

export function useSessionResult(sessionKey?: number | "latest") {
  return useQuery({
    queryKey: ["session_result", sessionKey],
    queryFn: () => fetchOpenF1("/v1/session_result", { session_key: sessionKey! }),
    enabled: !!sessionKey,
  });
}

export function useDrivers(sessionKey?: number | "latest") {
  return useQuery({
    queryKey: ["drivers", sessionKey],
    queryFn: () => fetchOpenF1("/v1/drivers", { session_key: sessionKey! }),
    enabled: !!sessionKey,
  });
}

export function useLaps(sessionKey?: number | "latest", driverNumber?: number) {
  return useQuery({
    queryKey: ["laps", sessionKey, driverNumber],
    queryFn: () => {
      const params: QueryParams = { session_key: sessionKey! };
      if (driverNumber) params.driver_number = driverNumber;
      return fetchOpenF1("/v1/laps", params);
    },
    enabled: !!sessionKey,
  });
}

export function usePitStops(sessionKey?: number | "latest") {
  return useQuery({
    queryKey: ["pit", sessionKey],
    queryFn: () => fetchOpenF1("/v1/pit", { session_key: sessionKey! }),
    enabled: !!sessionKey,
  });
}

export function useOvertakes(sessionKey?: number | "latest") {
  return useQuery({
    queryKey: ["overtakes", sessionKey],
    queryFn: () => fetchOpenF1("/v1/overtakes", { session_key: sessionKey! }),
    enabled: !!sessionKey,
  });
}

export function useWeather(sessionKey?: number | "latest") {
  return useQuery({
    queryKey: ["weather", sessionKey],
    queryFn: () => fetchOpenF1("/v1/weather", { session_key: sessionKey! }),
    enabled: !!sessionKey,
  });
}
