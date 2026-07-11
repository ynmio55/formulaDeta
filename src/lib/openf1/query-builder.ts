/**
 * Query Builder for OpenF1 API
 * 
 * Supports:
 * - Equals: { key: "value" } => key=value
 * - Less/Greater Than: { key: { lt: 10, gte: 5 } } => key<10&key>=5
 * - In/Array: { key: [1, 2, 3] } => key=1&key=2&key=3
 */

export type QueryOperator = "eq" | "gt" | "lt" | "gte" | "lte";

export type QueryValue = string | number | boolean | Date | null | "latest";

export type ComplexQueryValue = {
  [K in QueryOperator]?: QueryValue;
};

export type QueryParamValue = QueryValue | QueryValue[] | ComplexQueryValue;

export type QueryParams = {
  [key: string]: QueryParamValue;
} & {
  csv?: boolean;
};

function formatValue(val: QueryValue): string {
  if (val instanceof Date) {
    return val.toISOString();
  }
  return String(val);
}

export function buildOpenF1Query(params: QueryParams): string {
  const searchParams = new URLSearchParams();
  let rawQueryString = "";
  
  const append = (key: string, operator: string, value: QueryValue) => {
    const formatted = formatValue(value);
    const encodedKey = encodeURIComponent(key);
    const encodedOp = operator === "=" ? "=" : encodeURIComponent(operator);
    const encodedVal = encodeURIComponent(formatted);
    
    if (rawQueryString.length > 0) {
      rawQueryString += "&";
    }
    rawQueryString += `${encodedKey}${encodedOp}${encodedVal}`;
  };

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;

    // Direct value (eq)
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value instanceof Date || value === null) {
      append(key, "=", value);
    } 
    // Array of values (multiple eq)
    else if (Array.isArray(value)) {
      for (const val of value) {
        append(key, "=", val);
      }
    } 
    // Complex operators
    else if (typeof value === "object") {
      if ("eq" in value && value.eq !== undefined) append(key, "=", value.eq);
      if ("gt" in value && value.gt !== undefined) append(key, ">", value.gt);
      if ("gte" in value && value.gte !== undefined) append(key, ">=", value.gte);
      if ("lt" in value && value.lt !== undefined) append(key, "<", value.lt);
      if ("lte" in value && value.lte !== undefined) append(key, "<=", value.lte);
    }
  }

  return rawQueryString;
}
