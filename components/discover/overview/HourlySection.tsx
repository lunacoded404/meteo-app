"use client";

import React, { useState } from "react";
import type { ViewMode } from "./hourly/hourly.types";
import { useHourlyForecast } from "./hourly/useHourlyForecast";
import HourlyCard from "./hourly/HourlyCard";

export default function HourlySection() {
  const { region, days, selected, loading, err, dayKey, setDayKey } =
    useHourlyForecast();

  const [view, setView] = useState<ViewMode>("chart");
  const [showFeelsLike, setShowFeelsLike] = useState(false);

  return (
    <HourlyCard
      region={region}
      days={days}
      selected={selected}
      dayKey={dayKey}
      setDayKey={setDayKey as any}
      loading={loading}
      err={err}
      view={view}
      setView={setView}
      showFeelsLike={showFeelsLike}
      setShowFeelsLike={setShowFeelsLike}
    />
  );
}
