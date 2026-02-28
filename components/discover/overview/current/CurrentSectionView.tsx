"use client";

import React, { useMemo } from "react";
import { MapPin, Wind, Droplets, Cloud, Umbrella, AlertTriangle } from "lucide-react";


import type { ProvinceIndexItem } from "@/components/discover/overview/RegionSearch";

import type { CurrentWeather } from "./current.types";
import { cx } from "./current.utils";
import { fmtTimeVN } from "../details/details.utils";
import CurrentCard from "./CurrentCard";

export function StatusPill({ loading, err }: { loading: boolean; err: string | null }) {
  const base = "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] border backdrop-blur";
  if (err) {
    return (
      <span className={cx(base, "bg-rose-500/10 border-rose-400/20 text-rose-100")}>
        <AlertTriangle className="h-3.5 w-3.5" />
        Error
      </span>
    );
  }
  if (loading) {
    return (
      <span className={cx(base, "bg-white/8 border-white/10 text-white/70")}>
        <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-pulse" />
        Loading
      </span>
    );
  }
  return (
    <span className={cx(base, "bg-emerald-500/10 border-emerald-400/20 text-emerald-100")}>
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Live
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div
      className={cx(
        "group rounded-2xl border border-white/10 bg-white/6",
        "px-4 py-3 backdrop-blur-xl",
        "shadow-[0_16px_50px_rgba(0,0,0,0.25)]",
        "transition-transform duration-200 hover:-translate-y-[1px]",
        "hover:bg-white/8"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] text-white/70">
            <span className="opacity-90">{icon}</span>
            <span className="font-medium truncate">{label}</span>
          </div>
          <div className="mt-2 flex items-end gap-1.5">
            <div className="text-[18px] font-semibold text-white tracking-tight">{value}</div>
            {unit ? <div className="text-[12px] text-white/55 mb-[2px]">{unit}</div> : null}
          </div>
        </div>

        <div className="h-10 w-10 rounded-2xl bg-white/8 border border-white/10 grid place-items-center group-hover:bg-white/10 transition-colors">
          <div className="opacity-90">{icon}</div>
        </div>
      </div>
    </div>
  );
}

export default function CurrentSectionView({
  selectedRegion,
  onChangeRegion,
  items,
  loadingList,
  data,
  loading,
  err,
}: {
  selectedRegion: ProvinceIndexItem;
  onChangeRegion: (it: ProvinceIndexItem) => void;

  items: ProvinceIndexItem[];
  loadingList: boolean;

  data: CurrentWeather | null;
  loading: boolean;
  err: string | null;
}) {
  const title = data?.region?.name || selectedRegion?.name || "TP.Hồ Chí Minh";
  const updated = useMemo(() => fmtTimeVN(data?.time ?? null), [data?.time]);

  return (
    <section
      className={cx(
        "rounded-[28px] border border-white/10",
        "bg-gradient-to-b from-[#1f3a66]/80 via-[#1a2f54]/70 to-[#12213e]/70",
        "backdrop-blur-2xl",
        "shadow-[0_22px_80px_rgba(0,0,0,0.45)]",
        "p-5 md:p-6"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 text-white/95">
              <MapPin className="h-4 w-4" />
              <h2 className="text-[16px] md:text-[18px] font-semibold truncate max-w-[62vw]">
                {title}
              </h2>
            </div>

            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/70">
              Hiện tại
            </span>

            <StatusPill loading={loading} err={err} />
          </div>

          <div className="mt-1 text-[12px] text-white/70">{loading ? "Đang tải…" : updated}</div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="text-[11px] text-white/55 whitespace-nowrap">Nguồn: Open-Meteo</div>
        </div>
      </div>

      <CurrentCard data={data} loading={loading} err={err} />

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Wind className="h-4 w-4" />}
          label="Gió"
          value={data?.wind_kmh == null ? "—" : String(Math.round(data.wind_kmh))}
          unit="km/h"
        />
        <StatCard
          icon={<Droplets className="h-4 w-4" />}
          label="Độ ẩm"
          value={data?.humidity_percent == null ? "—" : String(Math.round(data.humidity_percent))}
          unit="%"
        />
        <StatCard
          icon={<Cloud className="h-4 w-4" />}
          label="Mây"
          value={data?.cloud_percent == null ? "—" : String(Math.round(data.cloud_percent))}
          unit="%"
        />
        <StatCard
          icon={<Umbrella className="h-4 w-4" />}
          label="Mưa"
          value={data?.precipitation_mm == null ? "—" : Number(data.precipitation_mm).toFixed(1)}
          unit="mm"
        />
      </div>
    </section>
  );
}
