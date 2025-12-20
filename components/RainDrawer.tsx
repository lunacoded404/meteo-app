"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import type { ProvinceRain, DailyRainPoint } from "./RainPopup";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

const formatDateLabel = (isoDate: string) => {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
};

const makeRainOption = (points: DailyRainPoint[]) => {
  const labels = points.map((p) => formatDateLabel(p.date));

  const mmVals = points.map((p) =>
    p.precipitation_sum_mm == null ? 0 : Number(p.precipitation_sum_mm.toFixed(1))
  );
  const maxMm = mmVals.reduce((a, b) => Math.max(a, b), 0);

  return {
    backgroundColor: "transparent",
    grid: { left: 44, right: 44, top: 44, bottom: 44 },

    legend: {
      top: 10,
      left: "center",
      textStyle: { fontSize: 11, color: "#0f172a" },
      data: ["Lượng mưa (mm)", "Xác suất mưa (%)"],
    },

    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      borderRadius: 8,
      padding: 10,
      textStyle: { fontSize: 11 },
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params];
        const axis = list?.[0]?.axisValue ?? "";

        const mmItem = list.find((x: any) => x.seriesName === "Lượng mưa (mm)");
        const probItem = list.find((x: any) => x.seriesName === "Xác suất mưa (%)");

        const mmRaw = mmItem?.data?.raw_mm ?? null;
        const probRaw = probItem?.data?.raw_prob ?? null;

        const mm = mmRaw == null ? "--" : `${Number(mmRaw).toFixed(1)} mm`;
        const prob = probRaw == null ? "--" : `${Math.round(Number(probRaw))}%`;

        return [
          `<b>${axis}</b>`,
          `Lượng mưa: <b>${mm}</b>`,
          `Xác suất mưa (max): <b>${prob}</b>`,
        ].join("<br/>");
      },
    },

    xAxis: {
      type: "category",
      data: labels,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#cbd5e1" } },
      axisLabel: { fontSize: 11, margin: 12 },
    },

    yAxis: [
      {
        type: "value",
        min: 0,
        max: maxMm === 0 ? 1 : Math.ceil(maxMm * 1.25),
        splitNumber: 4,
        axisLabel: { fontSize: 11 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#e2e8f0", type: "dashed", width: 0.8 } },
        name: "mm",
        nameTextStyle: { fontSize: 11, color: "#64748b" },
      },
      {
        type: "value",
        min: 0,
        max: 100,
        splitNumber: 4,
        axisLabel: { fontSize: 11, formatter: "{value}%" },
        axisLine: { show: false },
        splitLine: { show: false },
        name: "%",
        nameTextStyle: { fontSize: 11, color: "#64748b" },
      },
    ],

    series: [
      {
        name: "Lượng mưa (mm)",
        type: "bar",
        yAxisIndex: 0,
        barWidth: 18,
        barGap: "30%",
        data: points.map((p) => ({
          value: p.precipitation_sum_mm == null ? 0 : Number(p.precipitation_sum_mm.toFixed(1)),
          raw_mm: p.precipitation_sum_mm,
        })),
      },
      {
        name: "Xác suất mưa (%)",
        type: "bar",
        yAxisIndex: 1,
        barWidth: 10,
        data: points.map((p) => ({
          value: p.precipitation_probability_max == null ? 0 : Math.round(Number(p.precipitation_probability_max)),
          raw_prob: p.precipitation_probability_max,
        })),
      },
    ],

    animationDuration: 700,
    animationEasing: "cubicOut",
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
  if (!open) return null;

  const provinceName = data?.province?.name ?? "Mưa";
  const points = data?.daily?.points ?? [];
  const hasDaily = points.length > 0;

  const option = useMemo(() => makeRainOption(points), [points]);

  return (
    <div className="absolute left-4 bottom-4 z-[650] pointer-events-none">
      <div className="pointer-events-auto w-[560px] max-w-[92vw] h-[70vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-200 px-4 py-3 flex-shrink-0">
          <div />
          <div className="text-center">
            <div className="text-base sm:text-lg font-extrabold text-black">{provinceName}</div>
            <div className="text-xs text-slate-500">Dự báo lượng mưa và xác suất mưa 7 ngày tới</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100" type="button" aria-label="Close">
            <X className="h-5 w-5 text-black" />
          </button>
        </div>

        <div className="p-3 sm:p-4 flex-1">
          {hasDaily ? (
            <div className="h-full">
              <ReactECharts option={option} style={{ width: "100%", height: "100%" }} notMerge lazyUpdate />
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic">
              Chưa có dữ liệu daily để vẽ biểu đồ mưa 7 ngày cho khu vực này.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
