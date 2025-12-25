// src/components/discover/overview/days/DaysCard.tsx
"use client";

import React, { useMemo } from "react";
import type { DaysVM } from "./days.types";
import { codeToKind } from "./days.utils";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

type Cell = { kind: "blank" } | { kind: "day"; dateStr: string; dayNum: number };

function toDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`);
}

function fmtVN(dateStr: string) {
  const d = toDate(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function monthLabel(monthKey: string) {
  const [yy, mm] = monthKey.split("-").map(Number);
  const d = new Date(yy, (mm || 1) - 1, 1);
  if (Number.isNaN(d.getTime())) return monthKey;
  return d.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
}

function IconByCode({ code }: { code: number | null }) {
  const k = codeToKind(code);
  const cls = "w-4 h-4";
  if (k === "sun") return <Sun className={cls} />;
  if (k === "rain") return <CloudRain className={cls} />;
  if (k === "snow") return <CloudSnow className={cls} />;
  if (k === "storm") return <CloudLightning className={cls} />;
  if (k === "fog") return <CloudFog className={cls} />;
  return <Cloud className={cls} />;
}

function getMonthBounds(monthKey: string) {
  const [yy, mm] = monthKey.split("-").map(Number);
  const y = yy || new Date().getFullYear();
  const m = (mm || 1) - 1;
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  return { y, m, start, daysInMonth: end.getDate() };
}

// Monday-first index (Mon=0..Sun=6)
function mondayIndex(jsDay: number) {
  return (jsDay + 6) % 7;
}

export default function DaysCard({
  vm,
  loading,
  err,
  setMonthKey,
  setSelectedDate,
}: {
  vm: DaysVM;
  loading: boolean;
  err: string | null;
  setMonthKey: (k: string) => void;
  setSelectedDate: (d: string | null) => void;
}) {
  const { y, m, start, daysInMonth } = useMemo(() => getMonthBounds(vm.monthKey), [vm.monthKey]);

  const grid = useMemo(() => {
    const lead = mondayIndex(start.getDay());
    const cells: Cell[] = [];

    for (let i = 0; i < lead; i++) cells.push({ kind: "blank" });

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${pad2(m + 1)}-${pad2(d)}`;
      cells.push({ kind: "day", dateStr, dayNum: d });
    }

    while (cells.length % 7 !== 0) cells.push({ kind: "blank" });

    const weeks: Cell[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }, [y, m, start, daysInMonth]);

  const selected = vm.selectedDate ? vm.byDate[vm.selectedDate] : undefined;

  const monthIdx = vm.monthTabs.findIndex((t) => t.key === vm.monthKey);
  const prevKey = monthIdx > 0 ? vm.monthTabs[monthIdx - 1].key : null;
  const nextKey =
    monthIdx >= 0 && monthIdx < vm.monthTabs.length - 1 ? vm.monthTabs[monthIdx + 1].key : null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.35)] overflow-hidden">
      {/* Header */}
      <div className="p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-white text-[18px] font-semibold">Dự báo 15 ngày</div>
          <div className="text-white/70 text-[12px] truncate">
            Khu vực: {vm.region.name} • {monthLabel(vm.monthKey)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!prevKey}
            onClick={() => prevKey && setMonthKey(prevKey)}
            className={cx(
              "rounded-xl border border-white/10 bg-white/5 p-2 text-white/85 hover:bg-white/10 transition",
              !prevKey && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Tháng trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!nextKey}
            onClick={() => nextKey && setMonthKey(nextKey)}
            className={cx(
              "rounded-xl border border-white/10 bg-white/5 p-2 text-white/85 hover:bg-white/10 transition",
              !nextKey && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Tháng sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month tabs */}
      <div className="px-5 pb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {vm.monthTabs.map((t) => {
            const active = t.key === vm.monthKey;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setMonthKey(t.key)}
                className={cx(
                  "shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold border transition",
                  active
                    ? "bg-[#FFD84D] text-slate-900 border-transparent"
                    : "bg-white/5 text-white/85 border-white/10 hover:bg-white/10"
                )}
              >
                <span>{t.label}</span>
                {t.yearLabel ? <span className="ml-2 text-[12px] opacity-70">{t.yearLabel}</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
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
          <div className="grid grid-cols-1 gap-4">
            {/* Calendar */}
            <div className="rounded-2xl border border-white/10 bg-[#0B1220]/30 p-4">
              <div className="grid grid-cols-7 gap-2 text-[11px] text-white/60 pb-2">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                  <div key={d} className="text-center">
                    {d}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                {grid.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-2">
                    {week.map((c, ci) => {
                      if (c.kind === "blank") {
                        return <div key={ci} className="h-[84px] rounded-2xl bg-white/0" />;
                      }

                      const dp = vm.byDate[c.dateStr];
                      const has = !!dp;
                      const active = vm.selectedDate === c.dateStr;

                      return (
                        <button
                          key={ci}
                          type="button"
                          disabled={!has}
                          onClick={() => has && setSelectedDate(c.dateStr)}
                          className={cx(
                            "relative h-[84px] rounded-2xl border transition overflow-hidden",
                            "px-3 py-2 text-left",
                            has
                              ? "border-white/10 bg-[#0B1220]/35 hover:bg-[#0B1220]/50"
                              : "border-white/5 bg-white/0 opacity-40 cursor-not-allowed",
                            active && "ring-2 ring-white/25 border-white/20"
                          )}
                        >
                          {/* day number (top-left) */}
                          <div className="absolute top-2 left-2 text-[12px] font-semibold text-white/85">
                            {c.dayNum}
                          </div>

                          {has ? (
                            <div className="h-full flex items-center justify-between gap-2 pt-3">
                              {/* icon */}
                              <div className="flex-1 grid place-items-center">
                                <div className="text-white/90">
                                  <span className="[&>svg]:w-9 [&>svg]:h-9 block">
                                    <IconByCode code={dp.weather_code} />
                                  </span>
                                </div>
                              </div>

                              {/* temps (right, stacked) */}
                              <div className="w-[52px] flex flex-col items-end leading-none pr-1">
                                <div className="text-[16px] font-semibold text-white">
                                  {dp.tmax == null ? "—" : Math.round(dp.tmax)}°
                                </div>
                                <div className="mt-1 text-[13px] font-semibold text-white/65">
                                  {dp.tmin == null ? "—" : Math.round(dp.tmin)}°
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-[12px] text-white/40 pt-2">
                              —
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
