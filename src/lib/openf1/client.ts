import { OpenF1Endpoint, OpenF1Response } from "./types";
import { QueryParams, buildOpenF1Query } from "./query-builder";
import { EndpointSchemas } from "./schemas";
import { z } from "zod";

/**
 * OpenF1 API Client
 * Wraps fetching to our internal Next.js proxy (/api/openf1/...)
 */
export async function fetchOpenF1<T extends OpenF1Endpoint>(
  endpoint: T,
  params: QueryParams = {}
): Promise<OpenF1Response<T>> {
  const queryString = buildOpenF1Query(params);
  // Strip out the leading /v1/ so the proxy route handles it properly (e.g. /api/openf1/meetings)
  const proxyPath = endpoint.replace(/^\/v1\//, "");
  const url = `/api/openf1/${proxyPath}${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let errorMsg = "API request failed";
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch (e) {
      // Ignore JSON parse error
    }
    throw new Error(`OpenF1 Error (${response.status}): ${errorMsg}`);
  }

  const data = await response.json();

  // Validate response in development to catch schema mismatches,
  // but allow it to pass in production (or just always validate and log warning).
  const schema = EndpointSchemas[endpoint];
  if (schema) {
    const arraySchema = z.array(schema);
    const parsed = arraySchema.safeParse(data);
    if (!parsed.success) {
      console.warn(`[OpenF1 Schema Warning] endpoint ${endpoint}`, parsed.error);
      // We still return data even if it doesn't strictly match to avoid crashing the whole app
      // if OpenF1 adds a new field or changes a nullable type slightly.
    }
  }

  return data as OpenF1Response<T>;
}
