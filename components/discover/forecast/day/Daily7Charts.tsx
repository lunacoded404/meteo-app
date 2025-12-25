"use client";

import React, { useMemo } from "react";

import type { DailyPoint, DailyRow } from "./daily7.types";
import { round1 } from "./daily7.utils";
import { fmtDDMM } from "./daily7.utils";

import TemperaturePanel from "./panels/TemperaturePanel";
import HumidityPanel from "./panels/HumidityPanel";
import WindPanel from "./panels/WindPanel";
import CloudPanel from "./panels/CloudPanel";
import RainPanel from "./panels/RainPanel";

export type { DailyPoint };

export default function Daily7Charts({
  points,
  scrollOffsetPx = 120,
}: {
  points: DailyPoint[];
  scrollOffsetPx?: number;
}) {
  const rows: DailyRow[] = useMemo(() => {
    return (points ?? []).slice(0, 7).map((p) => ({
      date: p.date,
      label: fmtDDMM(p.date),

      tmax: round1(p.tmax_c),
      tmin: round1(p.tmin_c),

      hum: round1(p.humidity_mean_percent),
      cloud: round1(p.cloud_mean_percent),

      wind: round1(p.wind_speed_max_kmh),
      windDir: round1(p.wind_direction_dominant_deg),
      windDirLabel: p.wind_direction_dominant_label ?? null,

      rain: round1(p.rain_sum_mm),
      rainProb: round1(p.rain_prob_max_percent),
    }));
  }, [points]);

  return (
    <div style={{ ["--fp-offset" as any]: `${scrollOffsetPx}px` }} className="grid grid-cols-1 gap-4">
      <TemperaturePanel rows={rows} />
      <HumidityPanel rows={rows} />
      <WindPanel rows={rows} />
      <CloudPanel rows={rows} />
      <RainPanel rows={rows} />
    </div>
  );
}
