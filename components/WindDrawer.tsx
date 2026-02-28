"use client";

import React, { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import type { ProvinceWind, WindRoseSector } from "./popups/WindPopup";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

const makeWindRoseOption = (sectors: WindRoseSector[]) => {
  const labels = sectors.map((s) => s.dir_label);
  const counts = sectors.map((s) => s.count);
  const maxCount = counts.length > 0 ? Math.max(...counts) : 0;

  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      borderRadius: 6,
      padding: 8,
      textStyle: { fontSize: 11 },
      formatter: (params: any) => `${params.name}<br/>Tần suất: <b>${params.value}</b> lần`,
    },
    polar: { radius: ["18%", "82%"] },
    angleAxis: {
      type: "category",
      data: labels,
      startAngle: 90,
      axisLabel: { fontSize: 10, margin: 14 },
      axisLine: { lineStyle: { color: "#94a3b8", width: 0.5 } },
      axisTick: { show: false },
    },
    radiusAxis: {
      type: "value",
      min: 0,
      max: maxCount === 0 ? 1 : maxCount,
      splitNumber: 4,
      axisLabel: { fontSize: 10 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "#cbd5f5", type: "dashed", width: 0.7 } },
    },
    series: [
      {
        type: "bar",
        coordinateSystem: "polar",
        data: counts,
        name: "Tần suất",
        roundCap: true,
        barWidth: 14,
        itemStyle: {
          shadowBlur: 6,
          shadowColor: "rgba(15, 118, 110, 0.35)",
          shadowOffsetX: 0,
          shadowOffsetY: 2,
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#22c55e" },
              { offset: 1, color: "#0ea5e9" },
            ],
          },
        },
      },
    ],
    legend: { show: false },
    animationDuration: 700,
    animationEasing: "cubicOut",
  };
};

export default function WindDrawer({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: ProvinceWind | null;
}) {

  const provinceName = data?.province?.name ?? "Gió";
  const sectors = data?.rose ?? [];
  const hasRoseData = sectors.length > 0;

  const roseOption = useMemo(() => makeWindRoseOption(sectors), [sectors]);

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
        <div className="w-full rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[82vh] sm:max-h-[62vh] flex flex-col">
          <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-200 px-4 py-3 flex-shrink-0">
            <div />
            <div className="text-center min-w-0">
              <div className="text-base sm:text-lg font-extrabold text-black truncate">{provinceName}</div>
              <div className="text-xs text-slate-500">Wind rose ({data?.rose_period_hours ?? 24} giờ qua)</div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100" type="button" aria-label="Close">
              <X className="h-5 w-5 text-black" />
            </button>
          </div>

          <div className="p-3 sm:p-4 overflow-y-auto flex-1 text-black">
            {hasRoseData ? (
              <div className="h-[340px] sm:h-[420px]">
                <ReactECharts
                  option={roseOption}
                  autoResize={false}
                  style={{ width: "100%", height: "100%" }}
                  notMerge
                  lazyUpdate
                />
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">Chưa có đủ dữ liệu để vẽ wind rose cho khu vực này.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
