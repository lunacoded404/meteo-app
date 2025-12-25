"use client";

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

export const STORAGE_KEY = "meteo:lastRegion";

export function loadLastRegion(): RegionEventDetail | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj?.code || obj?.lat == null || obj?.lon == null) return null;
    return obj as RegionEventDetail;
  } catch {
    return null;
  }
}

export function publishRegionFromItem(it: any) {
  const c = it?.centroid;
  if (!c) return;

  const payload: RegionEventDetail = {
    code: it.code,
    name: it.name,
    lat: c.lat,
    lon: c.lon,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {}

  window.dispatchEvent(new CustomEvent("meteo:region", { detail: payload }));
}
