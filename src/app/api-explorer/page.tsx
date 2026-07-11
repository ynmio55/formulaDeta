"use client";

import { useState } from "react";
import { TerminalSquare, Play, Copy, Download, AlertTriangle } from "lucide-react";
import { QueryParams, buildOpenF1Query } from "@/lib/openf1/query-builder";
import { OpenF1Endpoint } from "@/lib/openf1/types";
import { EndpointSchemas } from "@/lib/openf1/schemas";

const ENDPOINTS: OpenF1Endpoint[] = Object.keys(EndpointSchemas) as OpenF1Endpoint[];

export default function APIExplorer() {
  const [endpoint, setEndpoint] = useState<OpenF1Endpoint>("/v1/meetings");
  const [filters, setFilters] = useState<{ key: string; op: string; value: string }[]>([
    { key: "year", op: "eq", value: "2024" }
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number>(0);

  const addFilter = () => {
    setFilters([...filters, { key: "", op: "eq", value: "" }]);
  };

  const removeFilter = (index: number) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
  };

  const updateFilter = (index: number, field: string, val: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: val };
    setFilters(newFilters);
  };

  const constructUrl = () => {
    const params: QueryParams = {};
    filters.forEach(f => {
      if (f.key && f.value) {
        if (f.op === "eq") params[f.key] = f.value;
        else params[f.key] = { [f.op]: f.value };
      }
    });
    const qs = buildOpenF1Query(params);
    return `/api/openf1${endpoint}${qs ? `?${qs}` : ""}`;
  };

  const url = constructUrl();

  const handleExecute = async () => {
    if ((endpoint === "/v1/car_data" || endpoint === "/v1/location") && filters.length === 0) {
      setError("Please add at least one filter (e.g. session_key) for large endpoints to prevent browser freezing.");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    const start = performance.now();
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResponse(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setExecutionTime(performance.now() - start);
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 border-b border-[var(--color-border-subtle)] pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <TerminalSquare className="w-8 h-8 text-[var(--color-f1-red)]" />
          API Explorer
        </h1>
        <p className="text-gray-400">Test and construct queries against the OpenF1 API proxy.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl p-5">
             <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Endpoint</label>
              <select 
                value={endpoint}
                onChange={e => setEndpoint(e.target.value as OpenF1Endpoint)}
                className="w-full bg-[var(--color-surface-3)] border border-[var(--color-border-strong)] rounded-md px-3 py-2 text-sm focus:border-[var(--color-f1-red)] focus:outline-none"
              >
                {ENDPOINTS.map(ep => (
                  <option key={ep} value={ep}>{ep}</option>
                ))}
              </select>
            </div>

            <div>
               <div className="flex justify-between items-center mb-2">
                 <label className="block text-sm font-medium text-gray-400">Filters</label>
                 <button onClick={addFilter} className="text-xs text-[var(--color-f1-red)] hover:text-red-400">+ Add Filter</button>
               </div>
               
               <div className="space-y-2">
                 {filters.map((f, i) => (
                   <div key={i} className="flex gap-2">
                     <input 
                       placeholder="Attribute" 
                       value={f.key}
                       onChange={e => updateFilter(i, 'key', e.target.value)}
                       className="flex-1 bg-[var(--color-surface-3)] border border-[var(--color-border-strong)] rounded-md px-3 py-1.5 text-sm"
                     />
                     <select
                       value={f.op}
                       onChange={e => updateFilter(i, 'op', e.target.value)}
                       className="w-24 bg-[var(--color-surface-3)] border border-[var(--color-border-strong)] rounded-md px-2 py-1.5 text-sm"
                     >
                       <option value="eq">=</option>
                       <option value="gt">&gt;</option>
                       <option value="lt">&lt;</option>
                       <option value="gte">&gt;=</option>
                       <option value="lte">&lt;=</option>
                     </select>
                     <input 
                       placeholder="Value" 
                       value={f.value}
                       onChange={e => updateFilter(i, 'value', e.target.value)}
                       className="flex-1 bg-[var(--color-surface-3)] border border-[var(--color-border-strong)] rounded-md px-3 py-1.5 text-sm"
                     />
                     <button onClick={() => removeFilter(i)} className="text-gray-500 hover:text-[var(--color-f1-red)] px-2">×</button>
                   </div>
                 ))}
                 {filters.length === 0 && <p className="text-sm text-gray-600">No filters applied.</p>}
               </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Preview URL</h3>
            <div className="flex gap-2">
              <div className="flex-1 bg-[var(--color-surface-3)] border border-[var(--color-border-strong)] rounded-md px-3 py-2 text-sm font-mono text-gray-300 overflow-x-auto whitespace-nowrap custom-scrollbar">
                {url}
              </div>
              <button 
                onClick={() => copyToClipboard(url)}
                className="bg-[var(--color-surface-2)] hover:bg-[var(--color-border-strong)] border border-[var(--color-border-strong)] rounded-md px-3 py-2 transition-colors"
                title="Copy URL"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            
            {(endpoint === "/v1/car_data" || endpoint === "/v1/location") && (
              <div className="mt-4 flex items-start gap-2 text-yellow-500 bg-yellow-500/10 p-3 rounded-md text-sm border border-yellow-500/20">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>Telemetry endpoints return very large datasets. Ensure you use specific filters (e.g., driver_number and session_key).</p>
              </div>
            )}

            <button 
              onClick={handleExecute}
              disabled={loading}
              className="mt-6 w-full bg-[var(--color-f1-red-hover)] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-md py-2 flex justify-center items-center gap-2 transition-colors"
            >
              {loading ? "Executing..." : <><Play className="w-4 h-4" /> Execute Query</>}
            </button>
          </div>
        </div>

        <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl flex flex-col overflow-hidden h-[600px]">
           <div className="border-b border-[var(--color-border-subtle)] px-4 py-3 flex justify-between items-center bg-[#151515]">
             <h3 className="text-sm font-medium text-gray-300">JSON Response</h3>
             {response && (
               <div className="flex items-center gap-4 text-xs text-gray-500">
                 <span>Time: {executionTime.toFixed(0)}ms</span>
                 <span>Records: {Array.isArray(response) ? response.length : 1}</span>
               </div>
             )}
           </div>
           <div className="flex-1 p-4 overflow-auto custom-scrollbar">
             {loading ? (
               <div className="text-gray-500 font-mono text-sm animate-pulse">Fetching...</div>
             ) : error ? (
               <div className="text-[var(--color-f1-red)] font-mono text-sm">{error}</div>
             ) : response ? (
               <pre className="text-[13px] font-mono text-green-400">
                 {JSON.stringify(response, null, 2)}
               </pre>
             ) : (
               <div className="text-gray-600 font-mono text-sm">Hit Execute Query to view response.</div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
