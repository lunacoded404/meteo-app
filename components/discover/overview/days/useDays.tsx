"use client";

import { useEffect, useMemo, useState } from "react";
import type { DailyForecastPoint, DaysVM, RegionDetail, RegionEventDetail } from "./days.types";
import { DEFAULT_REGION, STORAGE_KEY, buildMonthTabsFromDays, makeByDate, monthKeyOf, ymd } from "./days.utils";

type ForecastResp = {
  daily?: {
    time?: string[];
    temperature_2m_max?: Array<number | null>;
    temperature_2m_min?: Array<number | null>;
    weather_code?: Array<number | null>;
  };
};

export function readSavedRegion(): RegionDetail | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
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

export function buildDays(resp: ForecastResp): DailyForecastPoint[] {
  const d = resp.daily ?? {};
  const time = d.time ?? [];
  const tmax = d.temperature_2m_max ?? [];
  const tmin = d.temperature_2m_min ?? [];
  const wc = d.weather_code ?? [];

  const out: DailyForecastPoint[] = [];
  for (let i = 0; i < time.length; i++) {
    out.push({
      date: time[i],
      tmax: tmax[i] ?? null,
      tmin: tmin[i] ?? null,
      weather_code: wc[i] ?? null,
    });
  }
  return out;
}

export function useDays() {
  const [region, setRegion] = useState<RegionDetail>(DEFAULT_REGION);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [days, setDays] = useState<DailyForecastPoint[]>([]);
  const [monthKey, setMonthKey] = useState<string>(() => ymd(new Date()).slice(0, 7));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.searchParams.set("latitude", String(region.lat));
        url.searchParams.set("longitude", String(region.lon));
        url.searchParams.set("timezone", "auto");
        url.searchParams.set("forecast_days", "15");
        url.searchParams.set("daily", ["weather_code", "temperature_2m_max", "temperature_2m_min"].join(","));

        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

        const json = (await res.json()) as ForecastResp;
        const built = buildDays(json);

        if (!alive) return;
        setDays(built);

        if (built.length) {
          const mk = monthKeyOf(built[0].date);
          setMonthKey(mk);
          setSelectedDate(built[0].date);
        } else {
          setSelectedDate(null);
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Fetch failed");
        setDays([]);
        setSelectedDate(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [region.lat, region.lon]);

  const monthTabs = useMemo(() => buildMonthTabsFromDays(days), [days]);

  useEffect(() => {
    if (!monthTabs.length) return;

    const ok = monthTabs.some((t) => t.key === monthKey);
    if (!ok) {
      setMonthKey(monthTabs[0].key);
    }
  }, [monthTabs, monthKey]);

  useEffect(() => {
    if (!days.length) return;

    if (selectedDate && monthKeyOf(selectedDate) === monthKey) return;

    const firstInMonth = days.find((d) => monthKeyOf(d.date) === monthKey);
    if (firstInMonth) setSelectedDate(firstInMonth.date);
  }, [monthKey, days, selectedDate]);

  const byDate = useMemo(() => makeByDate(days), [days]);

  const vm: DaysVM = useMemo(
    () => ({
      region,
      days,
      monthKey,
      monthTabs,
      selectedDate,
      byDate,
    }),
    [region, days, monthKey, monthTabs, selectedDate, byDate]
  );

  return {
    vm,
    loading,
    err,
    setMonthKey,
    setSelectedDate,
  };
}
