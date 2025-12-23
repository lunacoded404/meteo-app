// src/components/discover/overview/details/useDetailsBundle.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { BundlePayload, DetailsVM, RegionDetail, RegionEventDetail } from "./details.types";
import { fmtTimeVN, sparkPath, sumRainNext24h, toSeriesNext24h, STORAGE_KEY } from "./details.utils";

const DEFAULT_REGION: RegionDetail = {
  code: "79",
  name: "TP.Hồ Chí Minh",
  lat: 10.8231,
  lon: 106.6297,
};

export function readSavedRegion(): RegionDetail | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as RegionEventDetail;
    if (
      typeof j?.code === "string" &&
      typeof j?.name === "string" &&
      typeof j?.lat === "number" &&
      typeof j?.lon === "number"
    ) {
      return { code: j.code, name: j.name, lat: j.lat, lon: j.lon };
    }
  } catch {}
  return null;
}

export function useDetailsBundle() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  const [region, setRegion] = useState<RegionDetail>(DEFAULT_REGION);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [bundle, setBundle] = useState<BundlePayload | null>(null);

  // init localStorage
  useEffect(() => {
    const saved = readSavedRegion();
    if (saved) setRegion(saved);
  }, []);

  // listen event from RegionSearch
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<RegionEventDetail>;
      if (!ce?.detail?.code) return;
      setRegion({
        code: ce.detail.code,
        name: ce.detail.name,
        lat: ce.detail.lat,
        lon: ce.detail.lon,
      });
    };

    window.addEventListener("meteo:region", handler as any);
    return () => window.removeEventListener("meteo:region", handler as any);
  }, []);

  // fetch bundle
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const url = new URL(`/api/provinces/${region.code}/bundle/`, apiBase);
        url.searchParams.set("days", "2");

        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as BundlePayload;
        if (!alive) return;
        setBundle(data);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Fetch failed");
        setBundle(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [apiBase, region.code]);

  const vm: DetailsVM = useMemo(() => {
    const hourly = Array.isArray(bundle?.hourly) ? bundle!.hourly! : [];
    const current = (bundle?.current || {}) as any;

    const temp24 = toSeriesNext24h(hourly, (p) => p.temperature_c);
    const feels24 = toSeriesNext24h(hourly, (p) => p.feels_like_c);
    const cloud24 = toSeriesNext24h(hourly, (p) => p.cloud_percent);

    return {
      region,
      timeText: fmtTimeVN(current?.time ?? null),
      current: {
        time: current?.time ?? null,
        temperature_c: current?.temperature_c ?? null,
        feels_like_c: current?.feels_like_c ?? null,
        humidity_percent: current?.humidity_percent ?? null,
        rain_mm: current?.rain_mm ?? null,
        cloud_percent: current?.cloud_percent ?? null,
        wind_speed: current?.wind_speed ?? null,
        wind_direction_deg: current?.wind_direction_deg ?? null,
        wind_direction_label: current?.wind_direction_label ?? null,
      },
      tempPath: sparkPath(temp24),
      feelsPath: sparkPath(feels24),
      cloudPath: sparkPath(cloud24),
      rain24sum: sumRainNext24h(hourly),
    };
  }, [bundle, region]);

  return { vm, loading, err };
}
