"use client";

import { useDrivers, useSessions } from "@/hooks/openf1";
import { fetchOpenF1 } from "@/lib/openf1/client";
import { CarData } from "@/lib/openf1/types";
import { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { Search, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SessionLayout } from "@/components/session/SessionLayout";
import { useTranslation } from "@/i18n/config";

// Function to downsample telemetry data for charts (to prevent browser freezing)
// Keeps 1 point every N points
function downsample(data: CarData[], targetPoints: number = 200) {
  if (!data || data.length === 0) return [];
  if (data.length <= targetPoints) return data;
  
  const step = Math.floor(data.length / targetPoints);
  const result = [];
  for (let i = 0; i < data.length; i += step) {
    result.push(data[i]);
  }
  return result;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const sessionKeyStr = searchParams.get("key");
  const activeSessionKey = sessionKeyStr ? parseInt(sessionKeyStr, 10) : null;
  
  const { data: drivers, isLoading: loadingDrivers } = useDrivers(activeSessionKey || undefined);

  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
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

  // Fetch telemetry when selection changes
  useEffect(() => {
    if (!activeSessionKey || selectedDrivers.length === 0) return;

    const fetchTelemetry = async () => {
      setIsLoadingTelemetry(true);
      const newTelemetry: Record<number, CarData[]> = {};
      
      try {
        await Promise.all(
          selectedDrivers.map(async (driverNumber) => {
            // Check if we already have it to avoid refetching
            if (telemetryData[driverNumber]) {
              newTelemetry[driverNumber] = telemetryData[driverNumber];
              return;
            }
            
            // Fetch telemetry data for the entire session
            // For production, we should add time ranges or just fetch fastest lap telemetry.
            // Since this could be massive, we request the API, then downsample immediately.
            const data = await fetchOpenF1("/v1/car_data", { 
              session_key: activeSessionKey, 
              driver_number: driverNumber 
            });
            
            // Downsample to ~500 points for charting
            newTelemetry[driverNumber] = downsample(data, 500);
          })
        );
        setTelemetryData(newTelemetry);
      } catch (e) {
        console.error("Failed to fetch telemetry", e);
      } finally {
        setIsLoadingTelemetry(false);
      }
    };

    fetchTelemetry();
  }, [selectedDrivers, activeSessionKey]);

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
      data: data.map(d => [d.date, d.speed]),
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
      type: 'time', 
      axisLabel: { color: '#888', formatter: '{HH}:{mm}:{ss}' },
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
      data: data.map(d => [d.date, d.throttle]),
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
        <div className="flex-1 space-y-6">
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
