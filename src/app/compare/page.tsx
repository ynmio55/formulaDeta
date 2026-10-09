"use client";

import { useDrivers, useLaps } from "@/hooks/openf1";
import { useQueryClient } from "@tanstack/react-query";
import { fetchOpenF1 } from "@/lib/openf1/client";
import { CarData } from "@/lib/openf1/types";
import { estimateDelta } from "@/lib/openf1/delta-time";
import { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { Search, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SessionLayout } from "@/components/session/SessionLayout";
import { useTranslation } from "@/i18n/config";

function CompareContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const sessionKeyStr = searchParams.get("key");
  const activeSessionKey = sessionKeyStr ? parseInt(sessionKeyStr, 10) : null;
  
  const { data: drivers, isLoading: loadingDrivers } = useDrivers(activeSessionKey || undefined);

  const queryClient = useQueryClient();
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>(() =>
    (searchParams.get("drivers") || "").split(",").map(Number)
      .filter(n => Number.isSafeInteger(n) && n > 0 && n < 1000).slice(0, 4)
  );
  const [selectedLap, setSelectedLap] = useState(() => {
    const candidate = Number(searchParams.get("lap") || 0);
    return Number.isSafeInteger(candidate) && candidate >= 0 && candidate <= 200 ? candidate : 0;
  }); // 0 = fastest valid lap per driver
  const { data: availableLaps } = useLaps(activeSessionKey || undefined, selectedDrivers[0]);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [telemetryData, setTelemetryData] = useState<Record<number, CarData[]>>({});
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);

  // Toggle driver selection
  const toggleDriver = (driverNumber: number) => {
    setSelectedDrivers(prev => {
      if (prev.includes(driverNumber)) {
        return prev.filter(n => n !== driverNumber);
      }
      if (prev.length >= 4) {
        alert("You can compare up to 4 drivers at once.");
        return prev;
      }
      return [...prev, driverNumber];
    });
  };

  // Fetch a single lap per driver instead of downloading whole-session telemetry.
  useEffect(() => {
    if (!activeSessionKey || selectedDrivers.length === 0) return;
    let cancelled = false;
    const fetchTelemetry = async () => {
      setIsLoadingTelemetry(true);
      setTelemetryError(null);
      try {
        const entries = await Promise.all(selectedDrivers.map(async driverNumber => {
          const laps = await queryClient.fetchQuery({
            queryKey: ["laps", activeSessionKey, driverNumber],
            queryFn: () => fetchOpenF1("/v1/laps", { session_key: activeSessionKey, driver_number: driverNumber }),
            staleTime: 30 * 60 * 1000,
          });
          const validLaps = laps.filter(l => l.date_start && l.lap_duration && l.lap_duration > 0);
          const lap = selectedLap === 0
            ? [...validLaps].sort((a, b) => (a.lap_duration || Infinity) - (b.lap_duration || Infinity))[0]
            : validLaps.find(l => l.lap_number === selectedLap);
          if (!lap?.date_start || !lap.lap_duration) return [driverNumber, [] as CarData[]] as const;
          const startDate = new Date(lap.date_start);
          if (!Number.isFinite(startDate.getTime())) return [driverNumber, [] as CarData[]] as const;
          const endDate = new Date(startDate.getTime() + lap.lap_duration * 1000);
          const requestParams = new URLSearchParams({
            session_key: String(activeSessionKey),
            driver_number: String(driverNumber),
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          });
          const response = await fetch(`/api/telemetry?${requestParams.toString()}`);
          if (!response.ok) throw new Error(`Telemetry request failed: ${response.status}`);
          const data = await response.json() as CarData[];
          return [driverNumber, data] as const;
        }));
        if (!cancelled) setTelemetryData(Object.fromEntries(entries));
      } catch {
        if (!cancelled) {
          setTelemetryData({});
          setTelemetryError("Telemetry could not be loaded. Check the selected lap or try another session.");
        }
      } finally {
        if (!cancelled) setIsLoadingTelemetry(false);
      }
    };
    void fetchTelemetry();
    return () => { cancelled = true; };
  }, [selectedDrivers, activeSessionKey, selectedLap, queryClient]);

  const relativeSeconds = (data: CarData[], point: CarData) =>
    data.length ? Math.round((Date.parse(point.date) - Date.parse(data[0].date)) / 10) / 100 : 0;

  if (!activeSessionKey) {
    return <div className="text-gray-400 p-8 text-center bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]">{t("state.selectSession")}</div>;
  }

  // Build chart options
  const speedSeries = selectedDrivers.map(dNumber => {
    const data = telemetryData[dNumber] || [];
    const driver = drivers?.find(d => d.driver_number === dNumber);
    return {
      name: driver?.name_acronym || `#${dNumber}`,
      type: 'line',
      showSymbol: false,
      data: data.map(d => [relativeSeconds(data, d), d.speed]),
      lineStyle: {
        color: driver?.team_colour ? `#${driver.team_colour}` : undefined
      }
    };
  });

  const speedChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: '#ccc' } },
    grid: { left: '5%', right: '5%', bottom: '15%', top: '15%' },
    xAxis: { 
      type: 'value',
      name: 'Elapsed (s)',
      axisLabel: { color: '#888' },
      splitLine: { show: false }
    },
    yAxis: { 
      type: 'value', 
      name: 'Speed (km/h)',
      nameTextStyle: { color: '#888' },
      axisLabel: { color: '#888' },
      splitLine: { lineStyle: { color: '#333' } }
    },
    series: speedSeries,
    dataZoom: [{ type: 'inside' }, { type: 'slider', textStyle: { color: '#fff' } }],
    backgroundColor: 'transparent',
  };

  const throttleSeries = selectedDrivers.map(dNumber => {
    const data = telemetryData[dNumber] || [];
    const driver = drivers?.find(d => d.driver_number === dNumber);
    return {
      name: driver?.name_acronym || `#${dNumber}`,
      type: 'line',
      showSymbol: false,
      data: data.map(d => [relativeSeconds(data, d), d.throttle]),
      lineStyle: {
        color: driver?.team_colour ? `#${driver.team_colour}` : undefined
      }
    };
  });

  const throttleChartOption = {
    ...speedChartOption,
    yAxis: { 
      ...speedChartOption.yAxis, 
      name: 'Throttle (%)',
      max: 100
    },
    series: throttleSeries
  };


  const makeSeries = (field: "brake" | "n_gear") => selectedDrivers.map(dNumber => {
    const driver = drivers?.find(d => d.driver_number === dNumber);
    return {
      name: driver?.name_acronym || String(dNumber),
      type: "line",
      step: field === "n_gear" ? "end" : undefined,
      showSymbol: false,
      data: (telemetryData[dNumber] || []).map(d => [relativeSeconds(telemetryData[dNumber] || [], d), Number(d[field])]),
      lineStyle: { color: driver?.team_colour ? "#" + driver.team_colour : undefined }
    };
  });

  const referenceDriver = selectedDrivers[0];
  const deltaSeries = selectedDrivers.slice(1).map(number => {
    const driver = drivers?.find(d => d.driver_number === number);
    return {
      name: driver?.name_acronym || "#" + number,
      type: "line",
      showSymbol: false,
      data: estimateDelta(telemetryData[referenceDriver] || [], telemetryData[number] || []),
      lineStyle: { color: driver?.team_colour ? "#" + driver.team_colour : undefined },
    };
  });
  const representativeLap = selectedLap === 0
    ? [...(availableLaps || [])].filter(l => l.lap_duration && l.date_start)
        .sort((a,b) => (a.lap_duration || Infinity) - (b.lap_duration || Infinity))[0]
    : (availableLaps || []).find(l => l.lap_number === selectedLap);

  const shareSelection = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("key", String(activeSessionKey));
    url.searchParams.set("drivers", selectedDrivers.join(","));
    url.searchParams.set("lap", String(selectedLap));
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "Formula Data telemetry", url: url.toString() });
        setShareStatus("Shared");
      } else {
        await navigator.clipboard.writeText(url.toString());
        setShareStatus("Share link copied");
      }
    } catch {
      setShareStatus("Could not share automatically; copy the address from your browser.");
    }
  };

  const exportCsv = () => {
    const rows = ["driver,date,speed,throttle,brake,gear"];
    selectedDrivers.forEach(number => {
      (telemetryData[number] || []).forEach(d => rows.push(
        [number, d.date, d.speed, d.throttle, Number(d.brake), d.n_gear].join(",")
      ));
    });
    const url = URL.createObjectURL(new Blob([rows.join("\n")], {type: "text/csv"}));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "formula-telemetry.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-6">
      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Driver Selector */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl p-4">
            <h3 className="font-semibold mb-3 border-b border-[var(--color-border-subtle)] pb-2">Select Drivers</h3>
            {loadingDrivers ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-[var(--color-surface-2)] rounded"></div>
                <div className="h-8 bg-[var(--color-surface-2)] rounded"></div>
              </div>
            ) : drivers ? (
              <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {drivers.map(driver => {
                  const isSelected = selectedDrivers.includes(driver.driver_number);
                  return (
                    <button
                      key={driver.driver_number}
                      onClick={() => toggleDriver(driver.driver_number)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors
                        ${isSelected ? 'bg-[var(--color-surface-2)] text-white' : 'hover:bg-[var(--color-surface-3)] text-gray-400'}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 rounded-full" style={{ backgroundColor: `#${driver.team_colour}` }}></div>
                        <span className="font-medium">{driver.full_name}</span>
                      </div>
                      <span className="text-xs">{driver.name_acronym}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {/* Charts Area */}
        <div className="hidden" aria-hidden="true"></div>
        <div className="flex-1 space-y-6">
          {selectedDrivers.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-3">
              <label htmlFor="lap-selection" className="text-sm font-medium">Compare laps</label>
              <select id="lap-selection" value={selectedLap} onChange={e => setSelectedLap(Number(e.target.value))}
                className="rounded-md bg-[var(--color-surface-2)] px-3 py-2 text-sm">
                <option value={0}>Fastest valid lap for each driver</option>
                {[...new Set((availableLaps || []).filter(l => l.date_start && l.lap_duration).map(l => l.lap_number))]
                  .sort((a,b) => a-b).map(n => <option key={n} value={n}>Lap {n}</option>)}
              </select>
              <span className="text-xs text-[var(--color-text-tertiary)]">Compare aligned elapsed seconds</span>
            </div>
          )}
          {telemetryError && <p role="alert" className="rounded-md border border-red-700 p-3 text-sm text-red-400">{telemetryError}</p>}
          {selectedDrivers.length === 0 ? (
            <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl p-10 flex flex-col items-center justify-center text-gray-500 min-h-[400px]">
              <Search className="w-10 h-10 mb-4 opacity-50" />
              <p>Select drivers from the sidebar to view telemetry traces.</p>
            </div>
          ) : (
            <>
              {isLoadingTelemetry && (
                <div className="flex items-center gap-2 text-[var(--color-f1-red)] bg-[var(--color-f1-red)]/10 px-4 py-2 rounded-lg w-fit text-sm font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading telemetry...
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={exportCsv} className="rounded border border-gray-600 p-2 text-sm">Export CSV</button>
                <button type="button" onClick={() => void shareSelection()} className="rounded border border-gray-600 p-2 text-sm">Share selection</button>
                {shareStatus && <span role="status" className="text-xs text-gray-400">{shareStatus}</span>}
              </div>
              {(["brake", "n_gear"] as const).map(field => (
                <div key={field} className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl p-4">
                  <h3 className="font-medium ml-2 mb-2">{field === "brake" ? "Brake" : "Gear"} Trace</h3>
                  <ReactECharts option={{...speedChartOption, series: makeSeries(field),
                    yAxis: { type: "value", name: field === "brake" ? "Brake" : "Gear" },
                  }} style={{height: 300, width: "100%"}} opts={{renderer: "canvas"}} />
                </div>
              ))}
              {representativeLap && (
                <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-4">
                  <h3 className="mb-3 text-sm font-medium">Sector times · selected first driver</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[representativeLap.duration_sector_1, representativeLap.duration_sector_2, representativeLap.duration_sector_3].map((value, index) => (
                      <div key={index} className="rounded-lg bg-[var(--color-surface-2)] p-3 text-center">
                        <p className="text-xs text-gray-400">Sector {index + 1}</p>
                        <p className="font-mono text-base">{value === null ? "—" : value.toFixed(3) + "s"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {deltaSeries.length > 0 && (
                <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-4">
                  <h3 className="mb-1 font-medium">Estimated Delta Time</h3>
                  <p className="mb-3 text-xs text-gray-400">Approximation from integrated speed; not official timing. Positive = slower than first selected driver.</p>
                  <ReactECharts option={{
                    tooltip: {trigger: "axis"}, legend: {textStyle:{color:"#ccc"}},
                    xAxis: {type:"value", name:"Estimated distance (m)"},
                    yAxis: {type:"value", name:"Delta (s)"},
                    series: deltaSeries, dataZoom: [{type:"inside"},{type:"slider"}],
                    backgroundColor:"transparent",
                  }} style={{height:320,width:"100%"}} opts={{renderer:"canvas"}} />
                </div>
              )}
              <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl p-4">
                <h3 className="font-medium ml-2 mb-2">Speed Trace</h3>
                <ReactECharts option={speedChartOption} style={{ height: 350, width: '100%' }} opts={{ renderer: 'canvas' }} />
              </div>
              
              <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl p-4">
                <h3 className="font-medium ml-2 mb-2">Throttle Trace</h3>
                <ReactECharts option={throttleChartOption} style={{ height: 350, width: '100%' }} opts={{ renderer: 'canvas' }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CompareDashboard() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]"></div>}>
      <SessionLayout>
        <CompareContent />
      </SessionLayout>
    </Suspense>
  );
}
