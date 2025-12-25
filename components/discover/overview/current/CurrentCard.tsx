"use client";
import React, { useMemo } from "react";
import { describeWeather } from "./current.utils";
import { cx } from "./current.utils";
import type { CurrentWeather } from "./current.types";

export default function CurrentCard({
  data,
  loading,
  err,
}: {
  data: CurrentWeather | null;
  loading: boolean;
  err: string | null;
}) {
  const desc = useMemo(() => describeWeather(data, loading), [data, loading]);

  return (
    <div
      className={cx(
        "mt-5 rounded-3xl border border-white/10",
        "bg-white/8 backdrop-blur-xl",
        "shadow-[0_18px_60px_rgba(0,0,0,0.35)]",
        "p-5 md:p-6 relative overflow-hidden"
      )}
    >
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-28 h-72 w-72 rounded-full bg-white/8 blur-3xl" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-3xl bg-white/10 border border-white/10 grid place-items-center overflow-hidden shrink-0">
            <img
              src="/weather.png"
              alt=""
              className="h-12 w-12 md:h-14 md:w-14 object-contain opacity-95"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-end gap-3">
              <div className="text-[64px] md:text-[84px] leading-none font-semibold text-white tracking-tight">
                {data?.temperature_c == null ? "—" : Math.round(data.temperature_c)}
              </div>
              <div className="pb-2 md:pb-3 text-[18px] md:text-[22px] text-white/75">°C</div>
            </div>

            <div className="mt-1 text-[16px] md:text-[18px] font-semibold text-white/90">
              {(() => {
                const t = data?.temperature_c;
                if (t == null) return "—";
                if (t >= 33) return "Nóng";
                if (t >= 28) return "Khá nóng";
                if (t >= 22) return "Dễ chịu";
                if (t >= 16) return "Mát";
                return "Lạnh";
              })()}

              {data?.cloud_percent != null ? (
                <span className="ml-2 text-white/70 font-medium text-[14px] md:text-[15px]">
                  •{" "}
                  {data.cloud_percent >= 75
                    ? "Nhiều mây"
                    : data.cloud_percent >= 40
                    ? "Mây rải rác"
                    : "Ít mây"}
                </span>
              ) : null}
            </div>

            <div className="mt-1 text-[13px] md:text-[14px] text-white/70 max-w-[64ch]">
              {desc}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {data?.meta?.wind_direction_label ? (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-white/75">
              Hướng gió:{" "}
              <span className="text-white/90 font-medium">
                {String(data.meta.wind_direction_label)}
              </span>
            </span>
          ) : null}

          {data?.meta?.timezone ? (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-white/75">
              TZ: <span className="text-white/90 font-medium">{String(data.meta.timezone)}</span>
            </span>
          ) : null}
        </div>
      </div>

      {err ? (
        <div className="relative mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-100">
          {err}
        </div>
      ) : null}
    </div>
  );
}
