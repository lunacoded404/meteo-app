// src/components/discover/overview/TrendsSection.tsx
"use client";

import React from "react";
import TrendsCard from "./trends/TrendsCard";
import { useTrends } from "./trends/useTrends";

export default function TrendsSection() {
  const { vm, chartData, loading, err, setMetric, setPeriod, setMonthFilter } = useTrends();

  return (
    <TrendsCard
      vm={vm}
      chartData={chartData}
      loading={loading}
      err={err}
      setMetric={setMetric}
      setPeriod={setPeriod}
      setMonthFilter={setMonthFilter}
    />
  );
}
