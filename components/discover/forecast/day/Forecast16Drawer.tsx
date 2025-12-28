"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { X, Menu } from "lucide-react";
import type { DailyPoint } from "./daily7.types";
import { fmtDDMM, round1 } from "./daily7.utils";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

function safeN(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ✅ deg -> tên hướng gió tiếng Việt + độ
function degToVN(deg?: number | null) {
  if (deg == null || Number.isNaN(deg)) return "—";
  const d = ((deg % 360) + 360) % 360;

  // 16 hướng (phù hợp dominant 16-sector)
  const dirs = [
    "Bắc",
    "Bắc Đông Bắc",
    "Đông Bắc",
    "Đông Đông Bắc",
    "Đông",
    "Đông Đông Nam",
    "Đông Nam",
    "Nam Đông Nam",
    "Nam",
    "Nam Tây Nam",
    "Tây Nam",
    "Tây Tây Nam",
    "Tây",
    "Tây Tây Bắc",
    "Tây Bắc",
    "Bắc Tây Bắc",
  ];
  const idx = Math.round(d / 22.5) % 16;
  return `${dirs[idx]} (${Math.round(d)}°)`;
}

// ✅ map label EN (N/NNE/NE/...) -> VN
function labelENToVN(label?: string | null) {
  if (!label) return null;
  const m: Record<string, string> = {
    N: "Bắc",
    NNE: "Bắc Đông Bắc",
    NE: "Đông Bắc",
    ENE: "Đông Đông Bắc",
    E: "Đông",
    ESE: "Đông Đông Nam",
    SE: "Đông Nam",
    SSE: "Nam Đông Nam",
    S: "Nam",
    SSW: "Nam Tây Nam",
    SW: "Tây Nam",
    WSW: "Tây Tây Nam",
    W: "Tây",
    WNW: "Tây Tây Bắc",
    NW: "Tây Bắc",
    NNW: "Bắc Tây Bắc",
  };
  const key = label.trim().toUpperCase();
  return m[key] ?? null;
}

// ✅ ưu tiên label (nếu có) nhưng luôn hiển thị tiếng Việt + (°)
function normalizeWindVN(p: DailyPoint) {
  const deg = safeN(p.wind_direction_dominant_deg);
  const vnFromLabel = labelENToVN(p.wind_direction_dominant_label ?? null);
  if (vnFromLabel && deg != null) return `${vnFromLabel} (${Math.round(deg)}°)`;
  if (vnFromLabel && deg == null) return vnFromLabel;
  return degToVN(deg);
}

function describeDay(p: DailyPoint) {
  const rain = safeN(p.rain_sum_mm) ?? 0;
  const prob = safeN(p.rain_prob_max_percent) ?? 0;
  const cloud = safeN(p.cloud_mean_percent) ?? 0;

  if (rain >= 30) return "Mưa rất to";
  if (rain >= 15) return "Mưa to";
  if (rain >= 5) return "Mưa vừa";
  if (rain > 0) return "Mưa nhẹ";
  if (prob >= 60) return "Có khả năng mưa";
  if (cloud >= 80) return "U ám / nhiều mây";
  if (cloud >= 60) return "Nhiều mây";
  if (cloud >= 30) return "Ít mây";
  return "Trời quang";
}

function badgeClass(desc: string) {
  if (desc.includes("Mưa rất to")) return "bg-rose-500/15 text-rose-200 border-rose-400/20";
  if (desc.includes("Mưa to")) return "bg-orange-500/15 text-orange-200 border-orange-400/20";
  if (desc.includes("Mưa vừa")) return "bg-amber-500/15 text-amber-200 border-amber-400/20";
  if (desc.includes("Mưa nhẹ") || desc.includes("khả năng mưa"))
    return "bg-sky-500/15 text-sky-200 border-sky-400/20";
  if (desc.includes("U ám")) return "bg-slate-500/15 text-slate-200 border-white/10";
  return "bg-emerald-500/15 text-emerald-200 border-emerald-400/20";
}

function getScrollbarWidth() {
  if (typeof window === "undefined") return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}

export default function Forecast16Drawer({
  open,
  onClose,
  points,
  regionName,
}: {
  open: boolean;
  onClose: () => void;
  points: DailyPoint[];
  regionName?: string;
}) {
  const [showTable, setShowTable] = useState(false);

  // ✅ LOCK scroll page khi drawer open (chỉ scroll trong drawer)
  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;

    const sbw = getScrollbarWidth();
    body.style.overflow = "hidden";
    // ✅ tránh giật layout khi mất scrollbar
    if (sbw > 0) body.style.paddingRight = `${sbw}px`;

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  const data16 = useMemo(() => (points ?? []).slice(0, 16), [points]);
  const x = useMemo(() => data16.map((p) => fmtDDMM(p.date)), [data16]);

  const option = useMemo(() => {
    const tmax = data16.map((p) => round1(p.tmax_c));
    const tmin = data16.map((p) => round1(p.tmin_c));
    const rain = data16.map((p) => round1(p.rain_sum_mm));
    const prob = data16.map((p) => round1(p.rain_prob_max_percent));

    return {
      tooltip: { trigger: "axis" },
      legend: {
        data: ["Cao nhất (°C)", "Thấp nhất (°C)", "Mưa (mm)", "XS mưa (%)"],
        bottom: 8,
        left: "center",
        textStyle: { color: "#cbd5e1" },
        itemGap: 18,
      },
      grid: { left: 52, right: 84, top: 20, bottom: 64 },
      xAxis: { type: "category", data: x, axisLabel: { color: "#cbd5e1" } },
      yAxis: [
        {
          type: "value",
          name: "°C",
          axisLabel: { formatter: "{value}°C", color: "#cbd5e1" },
          splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        },
        {
          type: "value",
          name: "mm",
          axisLabel: { formatter: "{value}mm", color: "#cbd5e1" },
          splitLine: { show: false },
        },
        {
          type: "value",
          name: "%",
          min: 0,
          max: 100,
          axisLabel: { formatter: "{value}%", color: "#cbd5e1" },
          offset: 42,
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "Mưa (mm)",
          type: "bar",
          yAxisIndex: 1,
          barMaxWidth: 24,
          data: rain,
          tooltip: {
            valueFormatter: (v: any) => (v == null || Number.isNaN(Number(v)) ? "—" : `${Number(v)} mm`),
          },
        },
        {
          name: "Cao nhất (°C)",
          type: "line",
          smooth: true,
          data: tmax,
          lineStyle: { color: "#ef4444", width: 2 },
          itemStyle: { color: "#ef4444" },
          tooltip: { valueFormatter: (v: any) => (v == null ? "—" : `${Math.round(Number(v))}°C`) },
        },
        {
          name: "Thấp nhất (°C)",
          type: "line",
          smooth: true,
          data: tmin,
          lineStyle: { color: "#3b82f6", width: 2 },
          itemStyle: { color: "#3b82f6" },
          tooltip: { valueFormatter: (v: any) => (v == null ? "—" : `${Math.round(Number(v))}°C`) },
        },
        {
          name: "XS mưa (%)",
          type: "line",
          yAxisIndex: 2,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          data: prob,
          tooltip: { valueFormatter: (v: any) => (v == null ? "—" : `${Math.round(Number(v))}%`) },
        },
      ],
    };
  }, [data16, x]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      {/* overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close 16-day forecast"
      />

      {/* panel */}
      <div className="absolute inset-x-0 top-[96px] mx-auto w-[min(1100px,calc(100vw-24px))] rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-white truncate">Dự báo 16 ngày</div>
            <div className="text-[12px] text-slate-300 truncate">{regionName ? regionName : "Khu vực"}</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-slate-100 hover:bg-white/10 transition"
              aria-expanded={showTable}
              title="Bật/tắt bảng chi tiết 16 ngày"
            >
              <Menu className="h-4 w-4" />
              {showTable ? "Ẩn bảng" : "Bảng 16 ngày"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full grid place-items-center border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* body: ✅ chỉ scroll trong drawer */}
        <div
          className="max-h-[calc(100vh-140px)] overflow-auto p-4 overscroll-contain"
          // ✅ ngăn “scroll xuyên” trên iOS/touch
          onWheelCapture={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* chart */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-[13px] font-semibold text-white">Tổng quan 16 ngày</div>
            <div className="mt-0.5 text-[12px] text-slate-300">Nhiệt độ (°C) • Lượng mưa tích lũy (mm) • Xác suất mưa (%)</div>
            <div className="mt-2">
              <ReactECharts option={option} style={{ height: 360, width: "100%" }} notMerge lazyUpdate />
            </div>
          </div>

          {/* table */}
          {showTable ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="border-b border-white/10 px-4 py-2 text-[13px] font-semibold text-white/90">Bảng chi tiết 16 ngày</div>
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full">
                  <thead className="bg-white/5">
                    <tr className="text-left text-[12px] text-slate-300">
                      <th className="px-4 py-2">Ngày</th>
                      <th className="px-4 py-2">Cao nhất</th>
                      <th className="px-4 py-2">Thấp nhất</th>
                      <th className="px-4 py-2">Độ ẩm trung bình</th>
                      <th className="px-4 py-2">Mây che phủ</th>
                      <th className="px-4 py-2">Mưa (mm)</th>
                      <th className="px-4 py-2">XS mưa</th>
                      <th className="px-4 py-2">Gió lớn nhất</th>
                      <th className="px-4 py-2">Hướng gió</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data16.map((p) => (
                      <tr key={p.date} className="border-t border-white/10 text-[13px] text-slate-100">
                        <td className="px-4 py-2">{fmtDDMM(p.date)}</td>
                        <td className="px-4 py-2">{round1(p.tmax_c) == null ? "—" : `${round1(p.tmax_c)}°C`}</td>
                        <td className="px-4 py-2">{round1(p.tmin_c) == null ? "—" : `${round1(p.tmin_c)}°C`}</td>
                        <td className="px-4 py-2">{round1(p.humidity_mean_percent) == null ? "—" : `${round1(p.humidity_mean_percent)}%`}</td>
                        <td className="px-4 py-2">{round1(p.cloud_mean_percent) == null ? "—" : `${round1(p.cloud_mean_percent)}%`}</td>
                        <td className="px-4 py-2">{round1(p.rain_sum_mm) == null ? "—" : `${round1(p.rain_sum_mm)}mm`}</td>
                        <td className="px-4 py-2">{round1(p.rain_prob_max_percent) == null ? "—" : `${round1(p.rain_prob_max_percent)}%`}</td>
                        <td className="px-4 py-2">{round1(p.wind_speed_max_kmh) == null ? "—" : `${round1(p.wind_speed_max_kmh)}km/h`}</td>
                        <td className="px-4 py-2">{normalizeWindVN(p)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {/* cards */}
          <div className="mt-4">
            <div className="text-[13px] font-semibold text-white">Mô tả theo ngày</div>
            <div className="mt-0.5 text-[12px] text-slate-300">Tóm tắt: nhiệt độ, mưa, mây, độ ẩm, gió</div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {data16.map((p) => {
                const desc = describeDay(p);
                return (
                  <div key={p.date} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[14px] font-semibold text-white">{fmtDDMM(p.date)}</div>
                        <div className={`mt-1 inline-flex items-center rounded-full border px-2 py-1 text-[12px] ${badgeClass(desc)}`}>
                          {desc}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[12px] text-slate-300">Nhiệt độ</div>
                        <div className="text-[14px] font-semibold text-white">
                          {round1(p.tmin_c) == null || round1(p.tmax_c) == null ? "—" : `${round1(p.tmin_c)}°C ~ ${round1(p.tmax_c)}°C`}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-slate-200">
                      <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                        Mưa: <span className="font-semibold">{round1(p.rain_sum_mm) == null ? "—" : `${round1(p.rain_sum_mm)}mm`}</span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                        XS mưa: <span className="font-semibold">{round1(p.rain_prob_max_percent) == null ? "—" : `${round1(p.rain_prob_max_percent)}%`}</span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                        Mây che phủ: <span className="font-semibold">{round1(p.cloud_mean_percent) == null ? "—" : `${round1(p.cloud_mean_percent)}%`}</span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                        Độ ẩm trung bình: <span className="font-semibold">{round1(p.humidity_mean_percent) == null ? "—" : `${round1(p.humidity_mean_percent)}%`}</span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                        Gió lớn nhất: <span className="font-semibold">{round1(p.wind_speed_max_kmh) == null ? "—" : `${round1(p.wind_speed_max_kmh)} km/h`}</span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                        Hướng gió: <span className="font-semibold">{normalizeWindVN(p)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-3" />
        </div>
      </div>
    </div>
  );
}
