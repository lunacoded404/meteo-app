"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { CloudRain, Droplets, Thermometer, Wind } from "lucide-react";
import type { MetricKey, PeriodKey, TrendsVM } from "./trends.types";
import { monthName } from "./trends.utils";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

export function pill(active: boolean) {
  return [
    "inline-flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-semibold transition",
    active ? "bg-[#FFD84D] text-slate-900" : "bg-white/10 text-white/85 hover:bg-white/15",
  ].join(" ");
}

export function fmtXAxisLabel(v: any) {
  if (typeof v === "string") return v.length >= 10 ? v.slice(5, 10) : v;

  if (typeof v === "number") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) {
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${mm}-${dd}`;
    }
  }
  return String(v ?? "");
}

export function fmtTooltipDate(v: any) {
  if (typeof v === "string") return v;
  if (typeof v === "number") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) {
      const yy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yy}-${mm}-${dd}`;
    }
  }
  return String(v ?? "");
}

export function fmtVal(v: any) {
  if (v == null) return "—";
  if (typeof v === "number") return Number.isFinite(v) ? v.toFixed(1) : "—";
  return String(v);
}

const selectCls =
  "rounded-xl bg-slate-900/80 border border-white/15 px-3 py-2 text-[13px] text-white outline-none " +
  "focus:ring-2 focus:ring-white/20";

export default function TrendsCard({
  vm,
  chartData,
  loading,
  err,
  setMetric,
  setPeriod,
  setMonthFilter,
}: {
  vm: TrendsVM;
  chartData: {
    x: any[];
    tmax: Array<number | null>;
    tmin: Array<number | null>;
    precip: Array<number | null>;
    hum: Array<number | null>;
    wind: Array<number | null>;
    ma_tmax: Array<number | null>;
    ma_precip: Array<number | null>;
    ma_hum: Array<number | null>;
    ma_wind: Array<number | null>;
  };
  loading: boolean;
  err: string | null;
  setMetric: (m: MetricKey) => void;
  setPeriod: (p: PeriodKey) => void;
  setMonthFilter: (m: number | "all") => void;
}) {
  const periodIs12m = vm.period === "12m";

  const option = useMemo(() => {
    const x = chartData.x;

    const tooltipFormatter = (params: any) => {
      const arr = Array.isArray(params) ? params : [params];
      const title = fmtTooltipDate(arr?.[0]?.axisValueLabel ?? arr?.[0]?.axisValue);

      const lines = arr
        .map((p: any) => {
          const name = p?.seriesName ?? "";
          const val = p?.data;
          return `${p?.marker ?? ""} ${name}: ${fmtVal(val)}`;
        })
        .join("<br/>");

      return `${title}<br/>${lines}`;
    };

    const showFullDate = !periodIs12m && vm.monthFilter !== "all";

    const base: any = {
      backgroundColor: "transparent",
      grid: { left: 52, right: 24, top: 26, bottom: 50 },
      tooltip: { trigger: "axis", axisPointer: { type: "line" }, formatter: tooltipFormatter },
      legend: { show: false },
      xAxis: {
        type: "category",
        data: x,
        axisLabel: {
          color: "rgba(255,255,255,0.7)",
          formatter: (v: any) => (showFullDate ? String(v ?? "") : fmtXAxisLabel(v)),
        },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
        axisTick: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "rgba(255,255,255,0.7)" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
      },
      series: [] as any[],
    };

    if (vm.metric === "temperature") {
      base.yAxis = {
        ...base.yAxis,
        axisLabel: { color: "rgba(255,255,255,0.7)", formatter: "{value}°" },
      };
      base.series = [
        {
          name: "Nhiệt độ cao nhất ngày",
          type: "line",
          data: chartData.tmax,
          smooth: true,
          symbol: "none",
          areaStyle: { opacity: 0.25 },
          lineStyle: { width: 2 },
        },
        {
          name: "Nhiệt độ thấp nhất ngày",
          type: "line",
          data: chartData.tmin,
          smooth: true,
          symbol: "none",
          areaStyle: { opacity: 0.18 },
          lineStyle: { width: 2 },
        },
        {
          name: "Trung bình 30 ngày",
          type: "line",
          data: chartData.ma_tmax,
          smooth: true,
          symbol: "none",
          lineStyle: { width: 2, type: "dashed", opacity: 0.85 },
        },
      ];
    } else if (vm.metric === "precipitation") {
      base.yAxis = {
        ...base.yAxis,
        axisLabel: { color: "rgba(255,255,255,0.7)", formatter: "{value} mm" },
        min: 0,
      };
      base.series = [
        {
          name: "Lượng mưa",
          type: "bar",
          data: chartData.precip,
          barWidth: 8,
          itemStyle: { opacity: 0.35 },
        },
        {
          name: "Trung bình 30 ngày",
          type: "line",
          data: chartData.ma_precip,
          smooth: true,
          symbol: "none",
          lineStyle: { width: 2, type: "dashed", opacity: 0.85 },
        },
      ];
    } else if (vm.metric === "humidity") {
      base.yAxis = {
        ...base.yAxis,
        axisLabel: { color: "rgba(255,255,255,0.7)", formatter: "{value}%" },
        min: 0,
        max: 100,
      };
      base.series = [
        {
          name: "Độ ẩm",
          type: "line",
          data: chartData.hum,
          smooth: true,
          symbol: "none",
          areaStyle: { opacity: 0.22 },
          lineStyle: { width: 2 },
        },
        {
          name: "Trung bình 30 ngày",
          type: "line",
          data: chartData.ma_hum,
          smooth: true,
          symbol: "none",
          lineStyle: { width: 2, type: "dashed", opacity: 0.85 },
        },
      ];
    } else {
      base.yAxis = {
        ...base.yAxis,
        axisLabel: { color: "rgba(255,255,255,0.7)", formatter: "{value} km/h" },
        min: 0,
      };
      base.series = [
        {
          name: "Gió (lớn nhất)",
          type: "line",
          data: chartData.wind,
          smooth: true,
          symbol: "none",
          areaStyle: { opacity: 0.18 },
          lineStyle: { width: 2 },
        },
        {
          name: "Trung bình 30 ngày",
          type: "line",
          data: chartData.ma_wind,
          smooth: true,
          symbol: "none",
          lineStyle: { width: 2, type: "dashed", opacity: 0.85 },
        },
      ];
    }

    return base;
  }, [chartData, vm.metric, vm.period, vm.monthFilter, periodIs12m]);

  const rows = periodIs12m ? vm.summaryRows_12m : vm.summaryRows_all;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.35)] overflow-hidden">
      <div className="p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-white text-[18px] font-semibold">Xu hướng thời tiết</div>
          <div className="text-white/70 text-[12px] truncate">
            Khu vực: {vm.region.name} • {vm.rangeLabel}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={vm.period === "12m" ? "12m" : String(vm.period)}
            onChange={(e) => {
              const v = e.target.value;
              setPeriod(v === "12m" ? "12m" : Number(v));
            }}
            className={selectCls}
          >
            <option value="12m">12 tháng gần nhất</option>
            {vm.years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={periodIs12m ? "all" : String(vm.monthFilter)}
            onChange={(e) => setMonthFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            disabled={periodIs12m}
            className={selectCls + (periodIs12m ? " opacity-60 cursor-not-allowed" : "")}
          >
            <option value="all">Tất cả các tháng</option>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={String(i + 1)}>
                {monthName(i + 1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-5 pb-4">
        <div className="flex flex-wrap gap-2">
          <button className={pill(vm.metric === "temperature")} onClick={() => setMetric("temperature")} type="button">
            <Thermometer className="h-4 w-4" /> Nhiệt độ
          </button>
          <button className={pill(vm.metric === "precipitation")} onClick={() => setMetric("precipitation")} type="button">
            <CloudRain className="h-4 w-4" /> Lượng mưa
          </button>
          <button className={pill(vm.metric === "humidity")} onClick={() => setMetric("humidity")} type="button">
            <Droplets className="h-4 w-4" /> Độ ẩm
          </button>
          <button className={pill(vm.metric === "wind")} onClick={() => setMetric("wind")} type="button">
            <Wind className="h-4 w-4" /> Gió
          </button>
        </div>

        {vm.warningText ? (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 text-[13px]">
            {vm.warningText}
          </div>
        ) : null}
      </div>

      <div className="px-5 pb-5">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 text-[13px]">
            Đang tải dữ liệu Open-Meteo...
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-100 text-[13px]">
            Lỗi: {err}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#0B1220]/30 p-3">
            <ReactECharts option={option} style={{ height: 420, width: "100%" }} notMerge lazyUpdate />
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 text-white/85 text-[13px] font-semibold">
              Thông tin khí hậu
            </div>
            <div className="px-4 py-3 grid grid-cols-3 text-[12px] text-white/70 border-b border-white/10">
              <div></div>
              <div className="text-center">12 tháng gần nhất</div>
              <div className="text-center">2025–2020</div>
            </div>

            {[
              ["Tháng nóng nhất", vm.climate_12m.hottest_month, vm.climate_all.hottest_month],
              ["Tháng lạnh nhất", vm.climate_12m.coldest_month, vm.climate_all.coldest_month],
              ["Tháng mưa nhiều nhất", vm.climate_12m.wettest_month, vm.climate_all.wettest_month],
              ["Tháng gió mạnh nhất", vm.climate_12m.windiest_month, vm.climate_all.windiest_month],
            ].map((r) => (
              <div
                key={r[0] as string}
                className="px-4 py-3 grid grid-cols-3 text-[13px] text-white/85 border-t border-white/10"
              >
                <div className="text-white/80">{r[0]}</div>
                <div className="text-center">{(r[1] as any) ?? "—"}</div>
                <div className="text-center">{(r[2] as any) ?? "—"}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 text-white/85 text-[13px] font-semibold">
              Tổng hợp theo ngày 
            </div>

            <div className="grid grid-cols-4 bg-white/5 px-4 py-2 text-[12px] text-white/70">
              <div></div>
              <div className="text-right">Cao nhất</div>
              <div className="text-right">Trung bình</div>
              <div className="text-right">Thấp nhất</div>
            </div>

            {rows.map((r) => (
              <div
                key={r.label}
                className="grid grid-cols-4 px-4 py-2 text-[13px] text-white/90 border-t border-white/10"
              >
                <div className="text-white/80">
                  {r.label} <span className="text-white/50 text-[12px]">({r.unit})</span>
                </div>
                <div className="text-right">{r.max == null ? "—" : r.max.toFixed(1)}</div>
                <div className="text-right">{r.avg == null ? "—" : r.avg.toFixed(1)}</div>
                <div className="text-right">{r.min == null ? "—" : r.min.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
