

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ProvinceSearchBar from "@/components/ProvinceSearchBar";
import type { ProvinceIndexItem } from "@/components/discover/overview/RegionSearch";

import Daily7Charts from "@/components/discover/forecast/day/Daily7Charts";
import ForecastFloatingPanel from "@/components/discover/forecast/day/ForecastFloatingPanel";
import Forecast16Drawer from "@/components/discover/forecast/day/Forecast16Drawer";

import type { DailyPoint } from "@/components/discover/forecast/day/daily7.types";
import { CalendarDays } from "lucide-react";

type BundlePayload = {
  region?: { code: string; name: string };
  daily: DailyPoint[];
  meta?: any;
};

const RAW_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");
const API_BASE = RAW_BASE.endsWith("/api") ? RAW_BASE : `${RAW_BASE}/api`;

const STORAGE_KEY = "meteo:lastRegion";

// ✅ cache list tỉnh/thành nhẹ
const INDEX_CACHE_KEY = "meteo:provinceIndex:v1";

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

  // ✅ Drawer 16 ngày
  const [open16, setOpen16] = useState(false);

  // ✅ tránh trường hợp user chọn rất nhanh rồi fetch list về override selection
  const userSelectedRef = useRef(false);

  // 1) Load provinces list (JSON nhẹ + cache local)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingList(true);

        // ✅ (A) render tức thì từ localStorage (nếu có)
        const cachedRaw = localStorage.getItem(INDEX_CACHE_KEY);
        if (cachedRaw) {
          const cached = safeParseJSON<{ items: ProvinceIndexItem[] }>(cachedRaw);
          const cachedItems =
            (cached?.items ?? []).filter(
              (x) => x?.code && x?.name && x?.centroid?.lat != null && x?.centroid?.lon != null
            ) || [];
          if (alive && cachedItems.length) {
            setItems(cachedItems);

            // restore selection từ localStorage nếu có
            const saved = safeParseJSON<ProvinceIndexItem>(localStorage.getItem(STORAGE_KEY));
            const found =
              (saved?.code ? cachedItems.find((p) => p.code === saved.code) : null) ??
              cachedItems.find((p) => p.code === "79") ??
              DEFAULT_HCM;

            if (!userSelectedRef.current) setSelected(found);
          }
        }

        // ✅ (B) fetch list nhẹ từ backend
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

        // ✅ restore selection theo list mới (nhưng không override nếu user đã chọn)
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

  // 2) Fetch bundle 16 days (để có đủ 7 + 16)
  useEffect(() => {
    if (!selected?.code) return;

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));

        const url = `${API_BASE}/provinces/${selected.code}/bundle/?days=16&tz=Asia/Ho_Chi_Minh`;
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

  const dailyAll = useMemo(() => (data?.daily ?? []).slice(0, 16), [data]);
  const daily7 = useMemo(() => dailyAll.slice(0, 7), [dailyAll]);
  const today = daily7[0];

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pb-10">
        {/* ✅ Top bar sticky */}
        <div className="sticky top-[96px] z-40">
          {/* lớp nền tràn ra ngoài theo padding container */}
          <div className="-mx-4 px-4 pb-3 pt-2">
            {/* nền blur + border mềm */}
            <div className="rounded-2xl border border-white/10 bg-gray-900/70 backdrop-blur">
              <div className="px-4 py-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="text-[18px] font-semibold text-white">DỰ BÁO THEO NGÀY</div>
                    <div className="text-[13px] text-slate-300">
                      {selected ? `${selected.name}` : "TP.Hồ Chí Minh"}
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                    <div className="w-full md:w-[420px] pointer-events-auto">
                      <ProvinceSearchBar
                        items={items.length ? items : [DEFAULT_HCM]}
                        placeholder={loadingList ? "Đang tải danh sách..." : "Tìm tỉnh/thành..."}
                        onSelect={(it) => {
                          userSelectedRef.current = true;
                          setSelected(it);
                        }}
                      />
                    </div>

                    {/* ✅ 1 nút riêng xem 16 ngày */}
                    <button
                      type="button"
                      onClick={() => setOpen16(true)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] text-slate-100 hover:bg-white/10 transition md:w-auto"
                      disabled={!dailyAll.length}
                      title="Xem dự báo 16 ngày"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Xem dự báo 16 ngày
                    </button>
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


        {/* ✅ Stats ngày hiện tại */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <Stat label="Nhiệt độ lớn nhất" value={today?.tmax_c ?? null} unit="°C" />
          <Stat label="Nhiệt độ nhỏ nhất" value={today?.tmin_c ?? null} unit="°C" />
          <Stat label="Độ ẩm trung bình" value={today?.humidity_mean_percent ?? null} unit="%" />
          <Stat label="Mây che phủ" value={today?.cloud_mean_percent ?? null} unit="%" />
          <Stat label="Lượng mưa tích lũy" value={today?.rain_sum_mm ?? null} unit="mm" />
        </div>

        {loading ? <div className="mt-3 text-[13px] text-slate-300">Đang tải dự báo…</div> : null}

        {/* ✅ Charts 7 ngày */}
        <div className="mt-4">
          {daily7.length ? (
            <>
              <ForecastFloatingPanel topOffsetPx={110} activeOffsetPx={120} />
              <Daily7Charts points={daily7} />
            </>
          ) : null}
        </div>
      </div>

      {/* ✅ Drawer 16 ngày */}
      <Forecast16Drawer open={open16} onClose={() => setOpen16(false)} points={dailyAll} regionName={selected?.name} />
    </>
  );
}
