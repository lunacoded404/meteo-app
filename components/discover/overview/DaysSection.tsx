"use client";

import React from "react";
import DaysCard from "./days/DaysCard";
import { useDays } from "./days/useDays";

export default function DaysSection() {
  const { vm, loading, err, setMonthKey, setSelectedDate } = useDays();

  return (
    <DaysCard
      vm={vm}
      loading={loading}
      err={err}
      setMonthKey={setMonthKey}
      setSelectedDate={setSelectedDate}
    />
  );
}
