"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { BarChart3, List, Thermometer, Droplets } from "lucide-react";

import type { DaySummary, RegionDetail, SelectedDay, ViewMode } from "./hourly.types";
import { cx, fmtDayLabel, fmtHour } from "./hourly.utils";
import WmoIcon from "./WmoIcon";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

export default function HourlyCard({
  region,
  days,
  selected,
  dayKey,
  setDayKey,
  loading,
  err,
  view,
  setView,
  showFeelsLike,
  setShowFeelsLike,
}: {
  region: RegionDetail;
  days: DaySummary[];
  selected: SelectedDay | null;
  dayKey: string | null;
  setDayKey: (v: string) => void;
  loading: boolean;
  err: string | null;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  showFeelsLike: boolean;
  setShowFeelsLike: (v: boolean) => void;
}) {
  const chartOption = useMemo(() => {
    if (!selected?.rows?.length) return null;

    const x = selected.rows.map((r) => fmtHour(r.time));
    const temp = selected.rows.map((r) => (showFeelsLike ? r.feels : r.temp));
    const rain = selected.rows.map((r) => (r.rain_mm == null ? 0 : r.rain_mm));

    const maxRain = Math.max(...rain, 0);
    const y2Max = Math.max(5, Math.ceil(maxRain * 1.25));

    return {
      backgroundColor: "transparent",
      grid: { left: 44, right: 24, top: 20, bottom: 44 },
      tooltip: { trigger: "axis", axisPointer: { type: "line" } },
      xAxis: {
        type: "category",
        data: x,
        axisLabel: { color: "rgba(255,255,255,0.75)" },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
      },
      yAxis: [
        {
          type: "value",
          axisLabel: { color: "rgba(255,255,255,0.75)", formatter: "{value}°" },
          splitLine: { lineStyle: { color: "rgba(255,255,255,0.10)" } },
        },
        {
          type: "value",
          min: 0,
          max: y2Max,
          axisLabel: { color: "rgba(255,255,255,0.55)", formatter: "{value} mm" },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: showFeelsLike ? "Cảm giác như" : "Nhiệt độ",
          type: "line",
          data: temp.map((v) => (v == null ? null : Math.round(v))),
          smooth: true,
          symbol: "none",
          areaStyle: { opacity: 0.25 },
          lineStyle: { width: 3 },
        },
        {
          name: "Lượng mưa",
          type: "bar",
          yAxisIndex: 1,
          data: rain.map((v) => Number(v.toFixed(2))),
          barWidth: 10,
          itemStyle: { opacity: 0.25 },
        },
      ],
    };
  }, [selected, showFeelsLike]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-white text-[18px] font-semibold">Dự báo theo giờ (7 ngày)</div>
          <div className="text-white/70 text-[12px]">
            Khu vực: {region.name}
          </div>
          <div className="text-white/70 text-[12px]">
            Tọa độ địa lý: {region.lat.toFixed(3)}, {region.lon.toFixed(3)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFeelsLike(!showFeelsLike)}
            className={cx(
              "inline-flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-semibold transition",
              showFeelsLike ? "bg-white text-slate-900" : "bg-white/10 text-white/85 hover:bg-white/15"
            )}
          >
            <Thermometer className="h-4 w-4" />
            Cảm giác như
          </button>

          <div className="flex overflow-hidden rounded-full border border-white/10 bg-white/10">
            <button
              type="button"
              onClick={() => setView("chart")}
              className={cx(
                "px-3 py-2 text-[13px] font-semibold inline-flex items-center gap-2",
                view === "chart" ? "bg-[#FFD84D] text-slate-900" : "text-white/85 hover:bg-white/10"
              )}
            >
              <BarChart3 className="h-4 w-4" /> Biểu đồ
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cx(
                "px-3 py-2 text-[13px] font-semibold inline-flex items-center gap-2",
                view === "list" ? "bg-[#FFD84D] text-slate-900" : "text-white/85 hover:bg-white/10"
              )}
            >
              <List className="h-4 w-4" /> Danh sách
            </button>
          </div>
        </div>
      </div>

      {/* Day picker */}
      <div className="px-5 pb-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {days.map((d) => {
            const isActive = d.date === dayKey;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setDayKey(d.date)}
                className={cx(
                  "shrink-0 rounded-2xl px-4 py-3 text-left transition border border-white/10",
                  isActive ? "bg-white/15" : "bg-white/5 hover:bg-white/10"
                )}
              >
                <div className="text-white/80 text-[12px]">{fmtDayLabel(d.date)}</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="rounded-2xl bg-white/10 border border-white/10 p-2">
                    <WmoIcon code={d.wmo} className="h-8 w-8 text-white/90" />
                  </div>

                  <div className="text-white text-[14px] font-semibold">
                    {d.tmax == null ? "—" : `${Math.round(d.tmax)}°`}
                    <span className="text-white/60 font-medium">{d.tmin == null ? "" : ` / ${Math.round(d.tmin)}°`}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-5">
        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 text-[13px]">
            Đang tải dữ liệu Open-Meteo...
          </div>
        )}

        {!loading && err && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-100 text-[13px]">
            Lỗi: {err}
          </div>
        )}

        {!loading && !err && !selected?.rows?.length && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 text-[13px]">
            Không có dữ liệu hourly.
          </div>
        )}

        {!loading && !err && selected?.rows?.length ? (
          view === "chart" ? (
            <div className="rounded-2xl border border-white/10 bg-[#0B1220]/30 p-3">
              <div className="flex items-center justify-between px-2 pb-2">
                <div className="text-white/85 text-[13px] font-semibold flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  {showFeelsLike ? "Cảm giác như (°C)" : "Nhiệt độ (°C)"}
                </div>
                <div className="text-white/60 text-[12px] flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Lượng mưa (mm)
                </div>
              </div>

              <ReactECharts option={chartOption} style={{ height: 320, width: "100%" }} notMerge lazyUpdate />
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className="grid grid-cols-5 bg-white/5 px-4 py-2 text-[12px] text-white/70">
                <div>Giờ</div>
                <div>Nhiệt độ</div>
                <div>Cảm giác</div>
                <div>Mưa</div>
                <div>Icon</div>
              </div>

              {selected.rows.map((r) => (
                <div
                  key={r.time}
                  className="grid grid-cols-5 px-4 py-2 text-[13px] text-white/90 border-t border-white/10"
                >
                  <div className="text-white/80">{fmtHour(r.time)}</div>
                  <div>{r.temp == null ? "—" : `${Math.round(r.temp)}°`}</div>
                  <div>{r.feels == null ? "—" : `${Math.round(r.feels)}°`}</div>
                  <div>{r.rain_mm == null ? "—" : `${r.rain_mm.toFixed(1)} mm`}</div>
                  <div className="flex items-center">
                    <WmoIcon code={r.wmo} className="h-6 w-6 text-white/85" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
