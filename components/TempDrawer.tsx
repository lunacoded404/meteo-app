"use client";

import React, { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import type { ProvinceWeather } from "./popups/TemperaturePopup";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

const formatDateLabel = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = d.getDate().toString().padStart(2, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${dd}/${mm}`;
};

const makeChartOption = (points: { date: string; tmin: number | null; tmax: number | null }[]) => ({
  grid: { left: 42, right: 18, top: 22, bottom: 55 },
  tooltip: {
    trigger: "axis",
    confine: true,
    backgroundColor: "#ffffff",
    textStyle: { fontSize: 11, color: "#0f172a" },
    formatter: (items: any[]) => {
      if (!items?.length) return "";
      const name = items[0].axisValue;
      const max = items.find((i: any) => i.seriesName.includes("Cao nhất"));
      const min = items.find((i: any) => i.seriesName.includes("Thấp nhất"));
      const maxVal = max?.data != null ? `${max.data.toFixed(1)} °C` : "—";
      const minVal = min?.data != null ? `${min.data.toFixed(1)} °C` : "—";
      return [`Ngày: ${name}`, `Cao nhất: ${maxVal}`, `Thấp nhất: ${minVal}`].join("<br/>");
    },
  },
  legend: {
    data: ["Cao nhất (°C)", "Thấp nhất (°C)"],
    bottom: 10,
    textStyle: { fontSize: 11 },
    icon: "circle",
  },
  xAxis: {
    type: "category",
    data: points.map((p) => p.date),
    axisLabel: { fontSize: 10 },
    axisTick: { alignWithLabel: true },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 40,
    interval: 10,
    axisLabel: { fontSize: 10 },
  },
  series: [
    {
      name: "Cao nhất (°C)",
      type: "line",
      data: points.map((p) => p.tmax),
      smooth: true,
      symbolSize: 6,
      itemStyle: { color: "#ef4444" },
      lineStyle: { color: "#ef4444", width: 2 },
      label: { show: true, position: "top", fontSize: 9, color: "#ef4444" },
    },
    {
      name: "Thấp nhất (°C)",
      type: "line",
      data: points.map((p) => p.tmin),
      smooth: true,
      symbolSize: 6,
      itemStyle: { color: "#2563eb" },
      lineStyle: { color: "blue", width: 2 },
      label: { show: true, position: "top", fontSize: 9, color: "#2563eb" },
    },
  ],
});

export default function TempDrawer({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: ProvinceWeather | null;
}) {

  const provinceName = data?.province?.name ?? "Nhiệt độ";

  const futurePoints = useMemo(
    () =>
      (data?.daily_future_7 || []).slice(0, 7).map((d) => ({
        date: formatDateLabel(d.time),
        tmin: d.tmin,
        tmax: d.tmax,
      })),
    [data]
  );

  const pastPoints = useMemo(() => {
    const arr = data?.daily_past_7 || [];
    const slice = arr.slice(-7);
    return slice.map((d) => ({
      date: formatDateLabel(d.time),
      tmin: d.tmin,
      tmax: d.tmax,
    }));
  }, [data]);

  const futureOption = useMemo(() => (futurePoints.length === 7 ? makeChartOption(futurePoints) : null), [futurePoints]);
  const pastOption = useMemo(() => (pastPoints.length === 7 ? makeChartOption(pastPoints) : null), [pastPoints]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[4000]">
      <button
        type="button"
        aria-label="Close overlay"
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
      />

      <div
        className="absolute pointer-events-auto left-3 right-3 bottom-3 sm:left-4 sm:right-auto sm:bottom-4 sm:w-[560px]"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0px)",
          paddingLeft: "max(env(safe-area-inset-left, 0px), 0px)",
          paddingRight: "max(env(safe-area-inset-right, 0px), 0px)",
        }}
      >
        <div className="w-full rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[82vh] sm:max-h-[74vh] flex flex-col">
          <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-200 px-4 py-3 flex-shrink-0">
            <div />
            <div className="text-center min-w-0">
              <div className="text-base sm:text-lg font-extrabold text-black truncate">{provinceName}</div>
              <div className="text-xs text-slate-500">Dự báo ngắn hạn (7 ngày)</div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100" type="button" aria-label="Close">
              <X className="h-5 w-5 text-black" />
            </button>
          </div>

          <div className="p-3 sm:p-4 space-y-3 overflow-y-auto text-black flex-1">
            <div className="space-y-2">
              <div className="font-bold text-sm">Nhiệt độ 7 ngày tới</div>
              {futureOption ? (
                <div className="h-[170px] sm:h-[200px]">
                  <ReactECharts option={futureOption} autoResize={false} style={{ width: "100%", height: "100%" }} notMerge lazyUpdate />
                </div>
              ) : (
                <div className="text-xs text-black/70 italic">Không đủ dữ liệu 7 ngày tới.</div>
              )}
            </div>

            <div className="space-y-2">
              <div className="font-bold text-sm">Nhiệt độ 7 ngày qua</div>
              {pastOption ? (
                <div className="h-[170px] sm:h-[200px]">
                  <ReactECharts option={pastOption} autoResize={false} style={{ width: "100%", height: "100%" }} notMerge lazyUpdate />
                </div>
              ) : (
                <div className="text-xs text-black/70 italic">Không đủ dữ liệu 7 ngày qua.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
