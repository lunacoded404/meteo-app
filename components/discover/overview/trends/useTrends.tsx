"use client";

import { useEffect, useMemo, useState } from "react";
import type { DailyPoint, MetricKey, PeriodKey, RegionDetail, RegionEventDetail, TrendsVM } from "./trends.types";
import {
  DEFAULT_REGION,
  STORAGE_KEY,
  ymd,
  movingAvg,
  stat,
  computeClimateInfo,
  computeWarning,
  monthOf,
  monthName,
} from "./trends.utils";

export type ArchiveResp = {
  daily?: {
    time?: string[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    precipitation_sum?: (number | null)[];
    wind_speed_10m_max?: (number | null)[];
  };
  hourly?: {
    time?: string[];
    relative_humidity_2m?: (number | null)[];
  };
};

const yearOf = (dateStr: string) => Number(dateStr.slice(0, 4));

function startOfYear(y: number) {
  return new Date(y, 0, 1);
}

function buildYears6(): number[] {
  const cur = new Date().getFullYear();
  return Array.from({ length: 6 }).map((_, i) => cur - i);
}

export function readSavedRegion(): RegionDetail | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (typeof j?.code === "string" && typeof j?.name === "string" && typeof j?.lat === "number" && typeof j?.lon === "number") {
      return { code: j.code, name: j.name, lat: j.lat, lon: j.lon };
    }
  } catch {}
  return null;
}

export function buildDailyFromArchive(resp: ArchiveResp): DailyPoint[] {
  const d = resp.daily ?? {};
  const times = d.time ?? [];
  const tmax = d.temperature_2m_max ?? [];
  const tmin = d.temperature_2m_min ?? [];
  const precip = d.precipitation_sum ?? [];
  const wind = d.wind_speed_10m_max ?? [];
  const h = resp.hourly ?? {};
  const ht = h.time ?? [];
  const rh = h.relative_humidity_2m ?? [];

  const humByDate = new Map<string, { sum: number; n: number }>();
  for (let i = 0; i < Math.min(ht.length, rh.length); i++) {
    const iso = ht[i];
    const v = rh[i];
    if (!iso || typeof v !== "number") continue;
    const date = iso.slice(0, 10);
    const cur = humByDate.get(date) ?? { sum: 0, n: 0 };
    cur.sum += v;
    cur.n += 1;
    humByDate.set(date, cur);
  }

  const out: DailyPoint[] = [];
  for (let i = 0; i < times.length; i++) {
    const date = times[i];
    const humAgg = humByDate.get(date);
    out.push({
      date,
      tmax: tmax[i] ?? null,
      tmin: tmin[i] ?? null,
      precip: precip[i] ?? null,
      wind: wind[i] ?? null,
      humidity: humAgg && humAgg.n ? humAgg.sum / humAgg.n : null,
    });
  }
  return out;
}

export function useTrends() {
  const [region, setRegion] = useState<RegionDetail>(DEFAULT_REGION);
  const [metric, setMetric] = useState<MetricKey>("temperature");
  const [period, setPeriod] = useState<PeriodKey>("12m");
  const [monthFilter, setMonthFilter] = useState<number | "all">("all");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dailyAll, setDailyAll] = useState<DailyPoint[]>([]);

  const years = useMemo(() => buildYears6(), []);

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
    if (period === "12m" && monthFilter !== "all") setMonthFilter("all");
  }, [period, monthFilter]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const end = new Date();
        end.setDate(end.getDate() - 1);

        const oldestYear = years[years.length - 1];
        const start = startOfYear(oldestYear);

        if (start > end) start.setDate(end.getDate() - 7);

        const url = new URL("https://archive-api.open-meteo.com/v1/archive");
        url.searchParams.set("latitude", String(region.lat));
        url.searchParams.set("longitude", String(region.lon));
        url.searchParams.set("start_date", ymd(start));
        url.searchParams.set("end_date", ymd(end));
        url.searchParams.set("timezone", "auto");

        url.searchParams.set(
          "daily",
          ["temperature_2m_max", "temperature_2m_min", "precipitation_sum", "wind_speed_10m_max"].join(",")
        );

        url.searchParams.set("hourly", "relative_humidity_2m");

        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

        const json = (await res.json()) as ArchiveResp;
        const daily = buildDailyFromArchive(json);

        if (!alive) return;
        setDailyAll(daily);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Fetch failed");
        setDailyAll([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [region.lat, region.lon, years]);

  const vm: TrendsVM = useMemo(() => {
    const last12m = dailyAll.length > 365 ? dailyAll.slice(-365) : dailyAll;

    let filtered: DailyPoint[] = [];

    if (period === "12m") {
      filtered = last12m;
    } else {
      filtered = dailyAll.filter((d) => yearOf(d.date) === period);

      if (monthFilter !== "all") {
        filtered = filtered.filter((d) => monthOf(d.date) === monthFilter);
      }
    }

    const climateAll = computeClimateInfo(dailyAll);
    const climate12m = computeClimateInfo(last12m);

    const makeRows = (arr: DailyPoint[]) => {
      const tHi = stat(arr.map((d) => d.tmax));
      const tLo = stat(arr.map((d) => d.tmin));
      const pr = stat(arr.map((d) => d.precip));
      const wd = stat(arr.map((d) => d.wind));
      const hu = stat(arr.map((d) => d.humidity));
      return [
        { label: "Nhiệt độ cao", unit: "°C", max: tHi.max, avg: tHi.avg, min: tHi.min },
        { label: "Nhiệt độ thấp", unit: "°C", max: tLo.max, avg: tLo.avg, min: tLo.min },
        { label: "Lượng mưa", unit: "mm", max: pr.max, avg: pr.avg, min: pr.min },
        { label: "Độ ẩm", unit: "%", max: hu.max, avg: hu.avg, min: hu.min },
        { label: "Gió", unit: "km/h", max: wd.max, avg: wd.avg, min: wd.min },
      ];
    };

    const rangeLabel =
      period === "12m"
        ? "12 tháng gần nhất • Tất cả các tháng"
        : `Năm ${period} • ${monthFilter === "all" ? "Tất cả các tháng" : monthName(monthFilter)}`;

    return {
      region,
      period,
      years,
      monthFilter,
      rangeLabel,
      metric,
      daily: filtered,

      climate_12m: climate12m,
      climate_all: climateAll,

      summaryRows_12m: makeRows(last12m),
      summaryRows_all: makeRows(period === "12m" ? last12m : dailyAll),

      warningText: computeWarning(period === "12m" ? last12m : dailyAll, metric),
    };
  }, [dailyAll, region, period, years, monthFilter, metric]);

  const chartData = useMemo(() => {
    const x = vm.daily.map((d) => d.date);
    const tmax = vm.daily.map((d) => d.tmax);
    const tmin = vm.daily.map((d) => d.tmin);
    const precip = vm.daily.map((d) => d.precip);
    const hum = vm.daily.map((d) => d.humidity);
    const wind = vm.daily.map((d) => d.wind);

    return {
      x,
      tmax,
      tmin,
      precip,
      hum,
      wind,
      ma_tmax: movingAvg(tmax, 30),
      ma_precip: movingAvg(precip, 30),
      ma_hum: movingAvg(hum, 30),
      ma_wind: movingAvg(wind, 30),
    };
  }, [vm.daily]);

  return {
    vm,
    chartData,
    loading,
    err,
    setMetric,
    setPeriod,      
    setMonthFilter,
  };

}
