"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { ProvinceIndexItem } from "@/components/discover/overview/RegionSearch";

import CurrentSectionView from "./current/CurrentSectionView";
import { useCurrentWeather } from "./current/useCurrentWeather";
import { loadLastRegion } from "./current/regionBus";
import { publishRegionFromItem } from "./current/regionBus";

const DEFAULT_HCM: ProvinceIndexItem = {
  code: "79",
  name: "TP.Hồ Chí Minh",
  centroid: { lat: 10.8231, lon: 106.6297 },
};

export default function CurrentSection({
  apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000",
}: {
  apiBase?: string;
}) {
  const [selectedRegion, setSelectedRegion] = useState<ProvinceIndexItem>(DEFAULT_HCM);

  useEffect(() => {
    const last = loadLastRegion();
    if (!last) return;

    setSelectedRegion({
      code: last.code,
      name: last.name,
      centroid: { lat: last.lat, lon: last.lon },
    });
  }, []);

  const { data, loading, err } = useCurrentWeather({
    apiBase,
    regionCode: selectedRegion?.code,
  });

  const onChangeRegion = useCallback((it: ProvinceIndexItem) => {
    setSelectedRegion(it);
    publishRegionFromItem(it);
  }, []);

  return (
    <CurrentSectionView
      apiBase={apiBase}
      selectedRegion={selectedRegion}
      onChangeRegion={onChangeRegion}
      data={data}
      loading={loading}
      err={err}
    />
  );
}
