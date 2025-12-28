// src/components/discover/overview/CurrentSection.tsx
"use client";

import React from "react";
import type { ProvinceIndexItem } from "@/components/discover/overview/RegionSearch";

import CurrentSectionView from "./current/CurrentSectionView";
import { useCurrentWeather } from "./current/useCurrentWeather";
import { useRegionBusSelection } from "./current/regionBus";

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
  // ✅ Lấy tỉnh/thành đang được chọn từ thanh tìm kiếm (publish qua regionBus)
  const selectedRegion = useRegionBusSelection(DEFAULT_HCM);

  const { data, loading, err } = useCurrentWeather({
    apiBase,
    regionCode: selectedRegion?.code,
  });

  // ✅ onChangeRegion / items / loadingList vẫn truyền để khỏi vỡ props
  // (UI search trong CurrentSectionView bạn đang ẩn rồi)
  return (
    <CurrentSectionView
      selectedRegion={selectedRegion}
      onChangeRegion={() => {}}
      items={[selectedRegion]}
      loadingList={false}
      data={data}
      loading={loading}
      err={err}
    />
  );
}
