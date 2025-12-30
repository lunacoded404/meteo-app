"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import type { ProvinceRain, DailyRainPoint } from "./popups/RainPopup";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

const formatDateLabel = (iso: string) => {
  // iso có thể là "2025-12-28" hoặc "2025-12-28T00:00:00"
  const d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
};

type RainChartPoint = {
  date: string;
  mm: number; // luôn number (0 nếu null)
  prob: number; // luôn number (0 nếu null)
  raw_mm: number; // raw (0 nếu null)
  raw_prob: number; // raw (0 nếu null)
};

const makeRainChartOption = (points: RainChartPoint[]) => {
  const axisLineStyle = { color: "#cbd5e1", width: 1 };
  const splitLineStyle = { color: "#e2e8f0", type: "dashed", width: 0.8 };

  return {
    grid: { left: 52, right: 52, top: 22, bottom: 55 },
    tooltip: {
      trigger: "axis",
      confine: true,
      backgroundColor: "#ffffff",
      textStyle: { fontSize: 11, color: "#0f172a" },
      formatter: (items: any[]) => {
        if (!items?.length) return "";
        const name = items[0].axisValue;

        const mmItem = items.find((i: any) => i.seriesName.includes("Lượng mưa"));
        const probItem = items.find((i: any) => i.seriesName.includes("Xác suất"));

        const mmRaw = mmItem?.data?.raw_mm ?? 0;
        const probRaw = probItem?.data?.raw_prob ?? 0;

        return [
          `Ngày: ${name}`,
          `Lượng mưa: <b>${Number(mmRaw).toFixed(1)} mm</b>`,
          `Xác suất mưa: <b>${Math.round(Number(probRaw))}%</b>`,
        ].join("<br/>");
      },
    },
    legend: {
      data: ["Lượng mưa (mm)", "Xác suất mưa (%)"],
      bottom: 10,
      textStyle: { fontSize: 11, color: "#0f172a" },
      icon: "circle",
    },
    xAxis: {
      type: "category",
      data: points.map((p) => p.date),
      axisLabel: { fontSize: 10, color: "#0f172a" },
      axisTick: { alignWithLabel: true },
      axisLine: { show: true, lineStyle: axisLineStyle },
    },
    yAxis: [
      {
        // ✅ mm cố định 0-40 giống “thước” của TempDrawer
        type: "value",
        min: 0,
        max: 40,
        interval: 10,
        name: "mm",
        nameTextStyle: { fontSize: 10, color: "#64748b" },
        axisLabel: { fontSize: 10, color: "#0f172a" },
        axisLine: { show: true, lineStyle: axisLineStyle },
        axisTick: { show: true, lineStyle: axisLineStyle },
        splitLine: { show: true, lineStyle: splitLineStyle },
      },
      {
        // ✅ % cố định 0-100
        type: "value",
        min: 0,
        max: 100,
        interval: 20,
        name: "%",
        nameTextStyle: { fontSize: 10, color: "#64748b" },
        axisLabel: { fontSize: 10, color: "#0f172a", formatter: "{value}%" },
        axisLine: { show: true, lineStyle: axisLineStyle },
        axisTick: { show: true, lineStyle: axisLineStyle },
        splitLine: { show: false },
      },
    ],
    series: [
      // ✅ baseline: luôn thấy “cột” dù mm=0
      {
        name: "__baseline_mm__",
        type: "pictorialBar",
        yAxisIndex: 0,
        silent: true,
        tooltip: { show: false },
        symbol: "rect",
        symbolSize: [18, 6],
        z: 1,
        itemStyle: { color: "rgba(59,130,246,0.18)" },
        data: points.map(() => 0),
      },

      {
        name: "Lượng mưa (mm)",
        type: "bar",
        yAxisIndex: 0,
        z: 2,
        barWidth: 18,
        // ✅ cột nhỏ vẫn thấy
        barMinHeight: 3,
        data: points.map((p) => ({
          value: p.mm,
          raw_mm: p.raw_mm,
        })),
        itemStyle: {
          color: (params: any) => {
            const v = Number(params?.value ?? 0);
            return v === 0 ? "rgba(59,130,246,0.35)" : "rgba(59,130,246,0.85)";
          },
          borderRadius: [6, 6, 2, 2],
        },
        emphasis: {
          itemStyle: {
            color: (params: any) => {
              const v = Number(params?.value ?? 0);
              return v === 0 ? "rgba(59,130,246,0.45)" : "rgba(37,99,235,0.95)";
            },
          },
        },
        // label giống TempDrawer (chỉ show khi > 0 để đỡ rối)
        label: {
          show: true,
          position: "top",
          fontSize: 9,
          color: "#0f172a",
          formatter: (p: any) => {
            const v = Number(p?.value ?? 0);
            return v > 0 ? v.toFixed(1) : "";
          },
        },
      },

      {
        name: "Xác suất mưa (%)",
        type: "line",
        yAxisIndex: 1,
        z: 3,
        smooth: true,
        showSymbol: true,
        showAllSymbol: true,
        symbol: "circle",
        symbolSize: 6,
        data: points.map((p) => ({
          value: p.prob,
          raw_prob: p.raw_prob,
        })),
        itemStyle: { color: "rgba(245,158,11,0.95)" },
        lineStyle: { color: "rgba(245,158,11,0.95)", width: 2 },
        // có thể bật label nếu muốn giống TempDrawer (nhưng hơi rối)
        label: { show: false },
        areaStyle: { opacity: 0.06 },
      },
    ],
  };
};

export default function RainDrawer({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: ProvinceRain | null;
}) {
  // ✅ Hooks luôn chạy (không return sớm)
  const provinceName = data?.province?.name ?? "Mưa";

  // Daily points: tuỳ payload bạn có thể là 7 ngày tới + 7 ngày qua.
  // Nếu backend chỉ có 7 ngày tới, thì “7 ngày qua” sẽ báo không đủ dữ liệu.
  const futureRaw = (data?.daily?.points ?? []).slice(0, 7);

  // ✅ Thử đọc “past” nếu backend có field khác
  // (Bạn có thể xoá/đổi nếu chắc chắn backend luôn có daily_past_7)
  const pastRaw: DailyRainPoint[] =
    // @ts-ignore
    (data as any)?.daily_past_7 ??
    // @ts-ignore
    (data as any)?.past_points ??
    [];

  const futurePoints = useMemo<RainChartPoint[]>(
    () =>
      futureRaw.map((p) => ({
        date: formatDateLabel(p.date),
        mm: p.precipitation_sum_mm == null ? 0 : Number(p.precipitation_sum_mm.toFixed(1)),
        prob:
          p.precipitation_probability_max == null
            ? 0
            : Math.round(Number(p.precipitation_probability_max)),
        raw_mm: p.precipitation_sum_mm ?? 0,
        raw_prob: p.precipitation_probability_max ?? 0,
      })),
    [futureRaw]
  );

  const pastPoints = useMemo<RainChartPoint[]>(
    () =>
      (pastRaw || []).slice(-7).map((p) => ({
        date: formatDateLabel((p as any).date ?? (p as any).time ?? ""),
        mm: (p as any).precipitation_sum_mm == null ? 0 : Number((p as any).precipitation_sum_mm.toFixed(1)),
        prob:
          (p as any).precipitation_probability_max == null
            ? 0
            : Math.round(Number((p as any).precipitation_probability_max)),
        raw_mm: (p as any).precipitation_sum_mm ?? 0,
        raw_prob: (p as any).precipitation_probability_max ?? 0,
      })),
    [pastRaw]
  );

  const futureOption = useMemo(
    () => (futurePoints.length === 7 ? makeRainChartOption(futurePoints) : null),
    [futurePoints]
  );
  const pastOption = useMemo(
    () => (pastPoints.length === 7 ? makeRainChartOption(pastPoints) : null),
    [pastPoints]
  );

  // ✅ lock scroll + ESC chỉ khi open
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
              <div className="text-xs text-slate-500">Dự báo ngắn hạn (mưa)</div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100" type="button" aria-label="Close">
              <X className="h-5 w-5 text-black" />
            </button>
          </div>

          <div className="p-3 sm:p-4 space-y-3 overflow-y-auto text-black flex-1">
            <div className="space-y-2">
              <div className="font-bold text-sm">Mưa 7 ngày tới</div>
              {futureOption ? (
                <div className="h-[170px] sm:h-[200px]">
                  <ReactECharts
                    option={futureOption}
                    autoResize={false}
                    style={{ width: "100%", height: "100%" }}
                    notMerge
                    lazyUpdate
                  />
                </div>
              ) : (
                <div className="text-xs text-black/70 italic">Không đủ dữ liệu 7 ngày tới.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
