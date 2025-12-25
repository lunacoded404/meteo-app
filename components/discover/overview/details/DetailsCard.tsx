// src/components/discover/overview/details/DetailsCard.tsx
"use client";

import React from "react";
import { Cloud, Droplets, Thermometer, Wind } from "lucide-react";
import type { DetailsVM } from "./details.types";

export function CardShell({
  title,
  rightTop,
  children,
}: {
  title: string;
  rightTop?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.25)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="text-white/90 text-[13px] font-semibold">{title}</div>
        {rightTop}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function HumidityBars({ value }: { value: number | null | undefined }) {
  const v = typeof value === "number" ? Math.max(0, Math.min(100, value)) : null;
  const bars = 10;
  const active = v == null ? 0 : Math.round((v / 100) * bars);
  return (
    <div className="flex items-end gap-1 h-10">
      {Array.from({ length: bars }).map((_, i) => {
        const on = i < active;
        return (
          <div
            key={i}
            className={["w-2 rounded-full", on ? "bg-sky-300/80" : "bg-white/10", "transition"].join(" ")}
            style={{ height: 12 + i * 2 }}
          />
        );
      })}
    </div>
  );
}

export default function DetailsCard({
  vm,
  loading,
  err,
}: {
  vm: DetailsVM;
  loading: boolean;
  err: string | null;
}) {
  const { region, timeText, current, tempPath, feelsPath, cloudPath, rain24sum } = vm;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-white text-[20px] font-semibold">Chi tiết</div>
          <div className="text-white/65 text-[12px]">
            Khu vực: {region.name}
          </div>
          <div className="text-white/65 text-[12px]">
            Tọa độ địa lý: {region.lat.toFixed(3)}, {region.lon.toFixed(3)}
          </div>
          <div className="text-white/65 text-[12px]">
            Cập nhật lúc: {timeText}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 text-[13px]">
          Đang tải dữ liệu Open-Meteo...
        </div>
      ) : err ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-100 text-[13px]">
          Lỗi: {err}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Temperature */}
        <CardShell title="Nhiệt độ" rightTop={<Thermometer className="h-4 w-4 text-white/70" />}>
          <div className="flex items-end justify-between">
            <div className="text-white text-[40px] font-semibold leading-none">
              {current.temperature_c == null ? "—" : `${Math.round(current.temperature_c)}°`}
            </div>
            <div className="h-12 w-[140px]">
              <svg viewBox="0 0 120 40" className="w-full h-full">
                <path d={tempPath} fill="none" stroke="rgba(45,212,191,0.95)" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-white/65 text-[12px]">Diễn biến 24h tới</div>
        </CardShell>

        {/* Feels like */}
        <CardShell title="Cảm giác như" rightTop={<Thermometer className="h-4 w-4 text-white/70" />}>
          <div className="flex items-end justify-between">
            <div className="text-white text-[40px] font-semibold leading-none">
              {current.feels_like_c == null ? "—" : `${Math.round(current.feels_like_c)}°`}
            </div>
            <div className="h-12 w-[140px]">
              <svg viewBox="0 0 120 40" className="w-full h-full">
                <path d={feelsPath} fill="none" stroke="rgba(147,197,253,0.95)" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-white/65 text-[12px]">Diễn biến 24h tới</div>
        </CardShell>

        {/* Cloud cover */}
        <CardShell title="Mây che phủ" rightTop={<Cloud className="h-4 w-4 text-white/70" />}>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-white text-[36px] font-semibold leading-none">
                {current.cloud_percent == null ? "—" : `${Math.round(current.cloud_percent)}%`}
              </div>
              <div className="mt-2 text-white/65 text-[12px]">Độ che phủ mây</div>
            </div>
            <div className="h-12 w-[140px]">
              <svg viewBox="0 0 120 40" className="w-full h-full">
                <path d={cloudPath} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </CardShell>

        {/* Precipitation */}
        <CardShell title="Lượng mưa" rightTop={<Droplets className="h-4 w-4 text-white/70" />}>
          <div className="text-white text-[36px] font-semibold leading-none">
            {Number.isFinite(rain24sum) ? `${rain24sum.toFixed(1)} mm` : "—"}
          </div>
          <div className="mt-2 text-white/65 text-[12px]">Tổng lượng mưa dự kiến trong 24h tới</div>
          {/* <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white/75 text-[12px]">
            Hiện tại: {current.rain_mm == null ? "—" : `${current.rain_mm.toFixed(1)} mm`}
          </div> */}
        </CardShell>

        {/* Wind */}
        <CardShell title="Gió" rightTop={<Wind className="h-4 w-4 text-white/70" />}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-[36px] font-semibold leading-none">
                {current.wind_speed == null ? "—" : `${Math.round(current.wind_speed)} km/h`}
              </div>
              <div className="mt-2 text-white/65 text-[12px]">
                {current.wind_direction_label ?? "—"}
                {current.wind_direction_deg == null ? "" : ` (${Math.round(current.wind_direction_deg)}°)`}
              </div>
            </div>

            <div className="relative h-16 w-16 rounded-full border border-white/10 bg-white/5 grid place-items-center">
              <div
                className="h-0 w-0 border-l-[6px] border-r-[6px] border-b-[18px] border-l-transparent border-r-transparent border-b-sky-300/90"
                style={{ transform: `rotate(${current.wind_direction_deg ?? 0}deg)` }}
              />
            </div>
          </div>
        </CardShell>

        {/* Humidity */}
        <CardShell title="Độ ẩm" rightTop={<Droplets className="h-4 w-4 text-white/70" />}>
          <div className="flex items-end justify-between">
            <div className="text-white text-[36px] font-semibold leading-none">
              {current.humidity_percent == null ? "—" : `${Math.round(current.humidity_percent)}%`}
            </div>
            <HumidityBars value={current.humidity_percent ?? null} />
          </div>
          <div className="mt-2 text-white/65 text-[12px]">Độ ẩm tương đối</div>
        </CardShell>
      </div>
    </div>
  );
}
