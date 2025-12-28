// src/components/discover/overview/current/regionBus.ts
"use client";

import { useEffect, useState } from "react";
import type { ProvinceIndexItem } from "@/components/discover/overview/RegionSearch";

export type RegionEventDetail = {
  code: string;
  name: string;
  lat: number;
  lon: number;
};

declare global {
  interface WindowEventMap {
    "meteo:region": CustomEvent<RegionEventDetail>;
  }
}

const STORAGE_KEY = "meteo:lastRegion";

export function loadLastRegion():
  | { code: string; name: string; lat: number; lon: number }
  | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const obj = JSON.parse(raw);
    if (!obj?.code || !obj?.name) return null;

    const lat = Number(obj?.centroid?.lat ?? obj?.lat);
    const lon = Number(obj?.centroid?.lon ?? obj?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    return { code: String(obj.code), name: String(obj.name), lat, lon };
  } catch {
    return null;
  }
}

export function publishRegionFromItem(it: ProvinceIndexItem) {
  if (typeof window === "undefined") return;

  const lat = Number(it?.centroid?.lat);
  const lon = Number(it?.centroid?.lon);
  if (!it?.code || !it?.name || !Number.isFinite(lat) || !Number.isFinite(lon)) return;

  // persist
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(it));
  } catch {}

  // dispatch event
  window.dispatchEvent(
    new CustomEvent<RegionEventDetail>("meteo:region", {
      detail: { code: it.code, name: it.name, lat, lon },
    })
  );
}

/**
 * ✅ FIX hydration:
 * - Render đầu luôn dùng defaultRegion (để SSR = CSR lần đầu)
 * - Sau mount mới đọc localStorage và update
 * - Nghe event meteo:region để sync theo search ở page
 */
export function useRegionBusSelection(defaultRegion: ProvinceIndexItem) {
  // ✅ IMPORTANT: KHÔNG đọc localStorage ở đây
  const [region, setRegion] = useState<ProvinceIndexItem>(defaultRegion);

  useEffect(() => {
    // ✅ Sau khi mount mới restore localStorage
    const last = loadLastRegion();
    if (last) {
      setRegion({
        code: last.code,
        name: last.name,
        centroid: { lat: last.lat, lon: last.lon },
      });
    } else {
      // nếu không có lastRegion thì vẫn đảm bảo default
      setRegion(defaultRegion);
    }

    const onEvt = (e: WindowEventMap["meteo:region"]) => {
      const d = e?.detail;
      if (!d?.code || !d?.name) return;

      const next: ProvinceIndexItem = {
        code: d.code,
        name: d.name,
        centroid: { lat: d.lat, lon: d.lon },
      };

      setRegion(next);

      // đồng bộ storage (tuỳ chọn)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
    };

    window.addEventListener("meteo:region", onEvt as any);
    return () => window.removeEventListener("meteo:region", onEvt as any);
  }, [defaultRegion]);

  return region;
}
