"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ProvinceSearchBar from "@/components/ProvinceSearchBar";
import type { ProvinceIndexItem } from "@/components/discover/overview/RegionSearch";

import HourlyCharts from "@/components/discover/forecast/hourly/HourlyCharts";
import HourlyFloatingPanel from "@/components/discover/forecast/hourly/HourlyFloatingPanel";

/** Types (theo payload province_bundle normalize ở Django) */
type HourlyPoint = {
  time: string;

  temperature_c: number | null;
  feels_like_c: number | null;

  humidity_percent: number | null;

  rain_mm: number | null;
  rain_prob_percent: number | null;

  cloud_percent: number | null;

  wind_speed: number | null;
  wind_direction_deg: number | null;
  wind_direction_label: string | null;
};

type BundlePayload = {
  region?: { code: string; name: string };
  location?: { lat: number; lon: number; timezone?: string | null };
  current?: {
    time?: string | null;
    temperature_c?: number | null;
    feels_like_c?: number | null;
    humidity_percent?: number | null;
    rain_mm?: number | null;
    rain_prob_percent?: number | null;
    cloud_percent?: number | null;
    wind_speed?: number | null;
    wind_direction_deg?: number | null;
    wind_direction_label?: string | null;
  };
  hourly: HourlyPoint[];
  meta?: any;
};

const RAW_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");
const API_BASE = RAW_BASE.endsWith("/api") ? RAW_BASE : `${RAW_BASE}/api`;

const STORAGE_KEY = "meteo:lastRegion";
const INDEX_CACHE_KEY = "meteo:provinceIndex:v1";

const DEFAULT_HCM: ProvinceIndexItem = {
  code: "79",
  name: "TP.Hồ Chí Minh",
  centroid: { lat: 10.8231, lon: 106.6297 },
};

export function Stat({ label, value, unit }: { label: string; value: any; unit?: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <div className="text-[12px] text-slate-300 truncate">{label}</div>
      <div className="mt-1 text-[22px] font-semibold text-white">
        {value ?? "—"}
        {unit ? <span className="ml-1 text-[14px] text-slate-300">{unit}</span> : null}
      </div>
    </div>
  );
}

export function safeParseJSON<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export default function HourlyForecastPage() {
  const [selected, setSelected] = useState<ProvinceIndexItem>(DEFAULT_HCM);

  const [items, setItems] = useState<ProvinceIndexItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [data, setData] = useState<BundlePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const userSelectedRef = useRef(false);

  // ✅ offsets cho floating panel: giảm trên mobile để khỏi che chart
  const [fpTop, setFpTop] = useState(100);
  const [fpActive, setFpActive] = useState(110);

  useEffect(() => {
    const apply = () => {
      const isMobile = window.matchMedia("(max-width: 640px)").matches;
      setFpTop(isMobile ? 88 : 110);
      setFpActive(isMobile ? 96 : 120);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // 1) Load provinces list (cache local + fetch)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingList(true);

        const cachedRaw = localStorage.getItem(INDEX_CACHE_KEY);
        if (cachedRaw) {
          const cached = safeParseJSON<{ items: ProvinceIndexItem[] }>(cachedRaw);
          const cachedItems =
            (cached?.items ?? []).filter(
              (x) => x?.code && x?.name && x?.centroid?.lat != null && x?.centroid?.lon != null
            ) || [];

          if (alive && cachedItems.length) {
            setItems(cachedItems);

            const saved = safeParseJSON<ProvinceIndexItem>(localStorage.getItem(STORAGE_KEY));
            const found =
              (saved?.code ? cachedItems.find((p) => p.code === saved.code) : null) ??
              cachedItems.find((p) => p.code === "79") ??
              DEFAULT_HCM;

            if (!userSelectedRef.current) setSelected(found);
          }
        }

        const res = await fetch(`${API_BASE}/province-index/`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { items: ProvinceIndexItem[] };

        const arr =
          (json?.items ?? []).filter(
            (x) => x?.code && x?.name && x?.centroid?.lat != null && x?.centroid?.lon != null
          ) || [];

        if (!alive) return;

        setItems(arr);
        localStorage.setItem(INDEX_CACHE_KEY, JSON.stringify({ items: arr }));

        const saved = safeParseJSON<ProvinceIndexItem>(localStorage.getItem(STORAGE_KEY));
        const found =
          (saved?.code ? arr.find((p) => p.code === saved.code) : null) ??
          arr.find((p) => p.code === "79") ??
          DEFAULT_HCM;

        if (!userSelectedRef.current) setSelected(found);
      } catch (e: any) {
        if (!alive) return;
        setItems([DEFAULT_HCM]);
        setSelected(DEFAULT_HCM);
        setErr(e?.message ?? "Không tải được danh sách tỉnh/thành");
      } finally {
        if (alive) setLoadingList(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // 2) Fetch hourly bundle
  useEffect(() => {
    if (!selected?.code) return;

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));

        const url = `${API_BASE}/provinces/${selected.code}/bundle/?days=7&tz=Asia/Ho_Chi_Minh`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as BundlePayload;

        if (!alive) return;
        setData(json);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Fetch failed");
        setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [selected?.code]);

  const cur = data?.current;

  return (
    <>
      {/* ✅ Container responsive */}
      <div className="mx-auto w-full max-w-[1200px] px-3 sm:px-4 lg:px-6 pb-10">
        {/* ✅ Top bar sticky: top responsive */}
        <div className="sticky top-[84px] sm:top-[96px] z-40">
          <div className="-mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 pb-3 pt-2">
            <div className="rounded-2xl border border-white/10 bg-gray-900/70 backdrop-blur">
              <div className="px-3 sm:px-4 py-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div className="min-w-0">
                    <div className="text-[16px] sm:text-[18px] font-semibold text-white">
                      DỰ BÁO THEO GIỜ
                    </div>
                    <div className="text-[13px] text-slate-300 truncate">
                      {selected ? `${selected.name}` : "TP.Hồ Chí Minh"}
                    </div>
                  </div>

                  {/* ✅ Search: full width trên mobile, gọn trên md+ */}
                  <div className="w-full md:w-[360px] lg:w-[420px] pointer-events-auto">
                    <ProvinceSearchBar
                      items={items.length ? items : [DEFAULT_HCM]}
                      placeholder={loadingList ? "Đang tải danh sách..." : "Tìm tỉnh/thành..."}
                      onSelect={(it) => {
                        userSelectedRef.current = true;
                        setSelected(it);
                      }}
                    />
                  </div>
                </div>

                {err ? (
                  <div className="mt-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-rose-200">
                    Lỗi: {err}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Stats: 1 → 2 → 3 → 5 để không bóp card */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Stat label="Nhiệt độ hiện tại" value={cur?.temperature_c ?? null} unit="°C" />
          <Stat label="Độ ẩm hiện tại" value={cur?.humidity_percent ?? null} unit="%" />
          <Stat label="Mây che phủ" value={cur?.cloud_percent ?? null} unit="%" />
          <Stat label="Mưa hiện tại" value={cur?.rain_mm ?? null} unit="mm" />
          <Stat label="Gió hiện tại" value={cur?.wind_speed ?? null} unit="km/h" />
        </div>

        {loading ? <div className="mt-3 text-[13px] text-slate-300">Đang tải dự báo theo giờ…</div> : null}

        {/* ✅ Charts */}
        <div className="mt-4 relative">
          {data?.hourly?.length ? (
            <>
              <HourlyFloatingPanel topOffsetPx={fpTop} activeOffsetPx={fpActive} />

              {/* chống tràn ngang + cho chart có không gian tối thiểu */}
              <div className="min-h-[360px] overflow-x-hidden">
                <HourlyCharts points={data.hourly} scrollOffsetPx={fpActive} />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
