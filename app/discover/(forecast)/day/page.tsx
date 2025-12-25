"use client";

import React, { useEffect, useMemo, useState } from "react";
import ProvinceSearchBar from "@/components/ProvinceSearchBar";
import type { ProvinceIndexItem } from "@/components/discover/overview/RegionSearch";
import Daily7Charts, { DailyPoint } from "@/components/discover/forecast/day/Daily7Charts";
import ForecastFloatingPanel from "@/components/discover/forecast/day/ForecastFloatingPanel";

type BundlePayload = {
  region?: { code: string; name: string };
  daily: DailyPoint[];
  meta?: any;
};

const RAW_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");
const API_BASE = RAW_BASE.endsWith("/api") ? RAW_BASE : `${RAW_BASE}/api`;

const STORAGE_KEY = "meteo:lastRegion";

// ✅ Default luôn là TP.HCM
const DEFAULT_HCM: ProvinceIndexItem = {
  code: "79",
  name: "TP.Hồ Chí Minh",
  centroid: { lat: 10.8231, lon: 106.6297 },
};

export function Stat({ label, value, unit }: { label: string; value: any; unit?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <div className="text-[12px] text-slate-300">{label}</div>
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

export default function DailyForecast() {
  const [selected, setSelected] = useState<ProvinceIndexItem>(DEFAULT_HCM);

  const [items, setItems] = useState<ProvinceIndexItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [data, setData] = useState<BundlePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 1) Load provinces list
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingList(true);
        const res = await fetch(`${API_BASE}/provinces/`, { cache: "no-store" });
        const gj = await res.json();

        const arr: ProvinceIndexItem[] = (gj?.features ?? [])
          .map((f: any) => ({
            code: String(f?.properties?.code ?? ""),
            name: String(f?.properties?.name ?? ""),
            centroid: {
              lat: Number(f?.properties?.centroid_lat),
              lon: Number(f?.properties?.centroid_lon),
            },
          }))
          .filter((x: ProvinceIndexItem) => x.code && x.name);

        if (!alive) return;
        setItems(arr);

        // ✅ restore selection từ localStorage (nếu có), nếu không thì TP.HCM
        const saved = safeParseJSON<ProvinceIndexItem>(localStorage.getItem(STORAGE_KEY));
        const found =
          (saved?.code ? arr.find((p) => p.code === saved.code) : null) ??
          arr.find((p) => p.code === "79") ??
          DEFAULT_HCM;

        setSelected(found);
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

  // 2) Fetch bundle 7 days khi selected thay đổi
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

  const daily7 = useMemo(() => (data?.daily ?? []).slice(0, 7), [data]);
  const today = daily7[0];

  return (
    <>
      {/* ✅ Spacer chống Header che (chỉ sửa trong page) */}
      <div className="h-[96px]" />

      {/* ✅ Page container */}
      <div className="mx-auto max-w-6xl px-4 pb-10">
        {/* ✅ Top bar sticky: search luôn thấy khi scroll, và không bị header che */}
        <div className="sticky top-[96px] z-40 -mx-4 px-4 pb-3 pt-2 backdrop-blur bg-gray-900/70">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[18px] font-semibold text-white">Dự báo theo ngày (7 ngày)</div>
              <div className="text-[13px] text-slate-300">
                {selected ? `${selected.name} (${selected.code})` : "TP.Hồ Chí Minh (79)"}
              </div>
            </div>

            <div className="w-full md:w-[420px]">
              <ProvinceSearchBar
                items={items.length ? items : [DEFAULT_HCM]}
                placeholder={loadingList ? "Đang tải danh sách..." : "Tìm tỉnh/thành..."}
                onSelect={(it) => setSelected(it)}
              />
            </div>
          </div>

          {err ? (
            <div className="mt-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-rose-200">
              Lỗi: {err}
            </div>
          ) : null}
        </div>

        {/* ✅ Stats */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <Stat label="Tmax (hôm nay)" value={today?.tmax_c ?? null} unit="°C" />
          <Stat label="Tmin (hôm nay)" value={today?.tmin_c ?? null} unit="°C" />
          <Stat label="Humidity TB" value={today?.humidity_mean_percent ?? null} unit="%" />
          <Stat label="Cloud TB" value={today?.cloud_mean_percent ?? null} unit="%" />
          <Stat label="Rain" value={today?.rain_sum_mm ?? null} unit="mm" />
        </div>

        {loading ? <div className="mt-3 text-[13px] text-slate-300">Đang tải dự báo…</div> : null}

        {/* ✅ Charts */}
        <div className="mt-4">
            {daily7.length ? (
            <>
                <ForecastFloatingPanel topOffsetPx={110} activeOffsetPx={120} />
                <Daily7Charts points={daily7} />
            </>
            ) : null}

        </div>
      </div>
    </>
  );
}
