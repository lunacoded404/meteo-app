"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import type { ProvinceWeather } from "./TemperaturePopup";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

const formatDateLabel = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = d.getDate().toString().padStart(2, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${dd}/${mm}`;
};

const makeChartOption = (
  points: { date: string; tmin: number | null; tmax: number | null }[]
) => ({
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
    axisPointer: { type: "line" },
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
      itemStyle: { color: "#ef4444" }, // ✅ đỏ
      lineStyle: { color: "#ef4444", width: 2 },
      label: { show: true, position: "top", fontSize: 9, color: "#ef4444" },
    },
    {
      name: "Thấp nhất (°C)",
      type: "line",
      data: points.map((p) => p.tmin),
      smooth: true,
      symbolSize: 6,
      itemStyle: { color: "#2563eb" }, // ✅ xanh dương
      lineStyle: { color: "#2563eb", width: 2 },
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
  if (!open) return null;

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

  const futureOption = futurePoints.length === 7 ? makeChartOption(futurePoints) : null;
  const pastOption = pastPoints.length === 7 ? makeChartOption(pastPoints) : null;

  return (
    <div className="absolute left-4 bottom-4 z-[650] pointer-events-none">
      <div className="pointer-events-auto w-[560px] max-w-[92vw] h-[74vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-[slideIn_200ms_ease-out]">
        {/* header */}
        <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-200 px-4 py-3">
          <div />
          <div className="text-center">
            <div className="text-base sm:text-lg font-extrabold text-black">{provinceName}</div>
            <div className="text-xs text-slate-500">Dự báo ngắn hạn (7 ngày)</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
            type="button"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-black" />
          </button>
        </div>

        {/* body (scroll) */}
        <div className="p-3 sm:p-4 space-y-3 overflow-y-auto h-[calc(74vh-56px-44px)] text-black">
          <div className="space-y-2">
            <div className="font-bold text-sm text-black">Nhiệt độ 7 ngày tới</div>
            {futureOption ? (
              <ReactECharts option={futureOption} style={{ width: "100%", height: 200 }} notMerge lazyUpdate />
            ) : (
              <div className="text-xs text-black/70 italic">Không đủ dữ liệu 7 ngày tới.</div>
            )}
          </div>

          <div className="space-y-2">
            <div className="font-bold text-sm text-black">Nhiệt độ 7 ngày qua</div>
            {pastOption ? (
              <ReactECharts option={pastOption} style={{ width: "100%", height: 200 }} notMerge lazyUpdate />
            ) : (
              <div className="text-xs text-black/70 italic">Không đủ dữ liệu 7 ngày qua.</div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(-16px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
