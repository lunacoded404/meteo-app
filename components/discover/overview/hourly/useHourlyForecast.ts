"use client";

import { useEffect, useMemo, useState } from "react";
import type { DaySummary, RegionDetail, SelectedDay } from "./hourly.types";

type RegionEventDetail = {
  code: string;
  name: string;
  lat: number;
  lon: number;
};

type BundleHourlyPoint = {
  time: string;
  temperature_c: number | null;
  feels_like_c: number | null;
  rain_mm: number | null;
  weather_code?: number | null;
  wmo?: number | null;
};

type BundlePayload = {
  region?: { code: string; name: string };
  hourly?: BundleHourlyPoint[];
  daily?: any[];
};

const STORAGE_KEY = "meteo:lastRegion";

const DEFAULT_REGION: RegionDetail = {
  code: "79",
  name: "TP.Hồ Chí Minh",
  lat: 10.8231,
  lon: 106.6297,
};

function readSavedRegion(): RegionDetail | null {
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

export function useHourlyForecast() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  const [region, setRegion] = useState<RegionDetail>(DEFAULT_REGION);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [rows, setRows] = useState<
    Array<{ time: string; temp: number | null; feels: number | null; rain_mm: number | null; wmo: number | null }>
  >([]);

  const [dayKey, setDayKey] = useState<string | null>(null);

  useEffect(() => {
    const saved = readSavedRegion();
    if (saved) setRegion(saved);
  }, []);

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

  useEffect(() => {
    const code = region?.code;
    if (!code) return;

    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const url = new URL(`/api/provinces/${code}/bundle/`, apiBase);
        url.searchParams.set("days", "10");

        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as BundlePayload;
        const hourly = Array.isArray(data?.hourly) ? data.hourly : [];

        const mapped = hourly
          .filter((p) => typeof p?.time === "string" && p.time.includes("T"))
          .map((p) => ({
            time: p.time,
            temp: p.temperature_c ?? null,
            feels: p.feels_like_c ?? null,
            rain_mm: p.rain_mm ?? null,
            wmo: (p.weather_code ?? p.wmo ?? null) as number | null,
          }));

        if (!alive) return;
        setRows(mapped);

        const firstDay = mapped[0]?.time?.split("T")?.[0] ?? null;
        setDayKey((prev) => prev ?? firstDay);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Fetch failed");
        setRows([]);
        setDayKey(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [apiBase, region.code]);

  const { days, selected } = useMemo((): { days: DaySummary[]; selected: SelectedDay | null } => {
    const map = new Map<
      string,
      Array<{ time: string; temp: number | null; feels: number | null; rain_mm: number | null; wmo: number | null }>
    >();

    for (const r of rows) {
      const d = r.time.split("T")[0];
      if (!d) continue;
      const list = map.get(d) || [];
      list.push(r);
      map.set(d, list);
    }

    const keys = Array.from(map.keys()).sort();

    const daysBuilt: DaySummary[] = keys.map((date) => {
      const list = map.get(date) || [];
      const temps = list.map((x) => x.temp).filter((v): v is number => typeof v === "number");
      const tmax = temps.length ? Math.max(...temps) : null;
      const tmin = temps.length ? Math.min(...temps) : null;
      const wmo = (list.find((x) => x.wmo != null)?.wmo ?? null) as any;

      return { date, tmax, tmin, wmo } as DaySummary;
    });

    const sel = dayKey ? (map.get(dayKey) ? ({ date: dayKey, rows: map.get(dayKey)! } as SelectedDay) : null) : null;

    return { days: daysBuilt, selected: sel };
  }, [rows, dayKey]);

  useEffect(() => {
    if (!days.length) return;
    if (!dayKey || !days.some((d) => d.date === dayKey)) {
      setDayKey(days[0].date);
    }
  }, [days, dayKey]);

  return {
    region, 
    days,
    selected,
    loading,
    err,
    dayKey,
    setDayKey,
  };
}
