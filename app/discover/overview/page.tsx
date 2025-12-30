"use client";

import React, { useEffect, useRef, useState } from "react";
import OverviewFloatingPanel from "@/components/discover/overview/OverviewFloatingPanel";

import CurrentSection from "@/components/discover/overview/CurrentSection";
import HourlySection from "@/components/discover/overview/HourlySection";
import DetailsSection from "@/components/discover/overview/DetailsSection";
import MapsSection from "@/components/discover/overview/MapsSection";
import DaysSection from "@/components/discover/overview/DaysSection";
import TrendsSection from "@/components/discover/overview/TrendsSection";

import ProvinceSearchBar from "@/components/ProvinceSearchBar";
import type { ProvinceIndexItem } from "@/components/discover/overview/RegionSearch";

const RAW_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");
const API_BASE = RAW_BASE.endsWith("/api") ? RAW_BASE : `${RAW_BASE}/api`;

const STORAGE_KEY = "meteo:lastRegion";
const INDEX_CACHE_KEY = "meteo:provinceIndex:v1";

const DEFAULT_HCM: ProvinceIndexItem = {
  code: "79",
  name: "TP.Hồ Chí Minh",
  centroid: { lat: 10.8231, lon: 106.6297 },
};

function safeParseJSON<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function emitRegion(it: ProvinceIndexItem) {
  const lat = Number(it?.centroid?.lat);
  const lon = Number(it?.centroid?.lon);

  window.dispatchEvent(
    new CustomEvent("meteo:region", {
      detail: {
        code: it.code,
        name: it.name,
        lat: Number.isFinite(lat) ? lat : DEFAULT_HCM.centroid!.lat,
        lon: Number.isFinite(lon) ? lon : DEFAULT_HCM.centroid!.lon,
      },
    })
  );
}

export default function OverviewPage() {
  const [selected, setSelected] = useState<ProvinceIndexItem>(DEFAULT_HCM);

  const [items, setItems] = useState<ProvinceIndexItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const userSelectedRef = useRef(false);

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

            if (!userSelectedRef.current) {
              setSelected(found);
              emitRegion(found);
            }
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

        if (!userSelectedRef.current) {
          setSelected(found);
          emitRegion(found);
        }
      } catch (e: any) {
        if (!alive) return;
        setItems([DEFAULT_HCM]);
        setSelected(DEFAULT_HCM);
        setErr(e?.message ?? "Không tải được danh sách tỉnh/thành");
        emitRegion(DEFAULT_HCM);
      } finally {
        if (alive) setLoadingList(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!selected?.code) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    emitRegion(selected);
  }, [selected?.code]);

  return (
    <div className="relative">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0614] via-gray-900 to-black/90" />
      </div>

      {/* ✅ Container responsive đồng bộ với Daily/Hourly */}
      <div className="mx-auto w-full max-w-[1200px] px-3 sm:px-4 lg:px-6 pb-10">
        {/* Floating panel */}
        <OverviewFloatingPanel />

        {/* ✅ Sticky topbar: top responsive */}
        <div className="sticky top-[84px] sm:top-[96px] z-40">
          {/* ✅ tràn nền đúng theo padding container */}
          <div className="-mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 pb-3 pt-2">
            <div className="rounded-2xl border border-white/10 bg-gray-900/70 backdrop-blur">
              <div className="px-3 sm:px-4 py-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div className="min-w-0">
                    <div className="text-[16px] sm:text-[18px] font-semibold text-white">TỔNG QUAN</div>
                    <div className="text-[13px] text-slate-300 truncate">
                      {selected ? `${selected.name}` : "TP.Hồ Chí Minh"}
                    </div>
                  </div>

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

        {/* ✅ Sections: scroll-mt theo header + sticky bar */}
        <div className="mt-4 space-y-6">
          <section id="current" className="scroll-mt-[140px] sm:scroll-mt-[150px]">
            <CurrentSection />
          </section>

          <section id="hourly" className="scroll-mt-[140px] sm:scroll-mt-[150px]">
            <HourlySection />
          </section>

          <section id="details" className="scroll-mt-[140px] sm:scroll-mt-[150px]">
            <DetailsSection />
          </section>

          <section id="maps" className="scroll-mt-[140px] sm:scroll-mt-[150px]">
            <MapsSection />
          </section>

          <section id="monthly" className="scroll-mt-[140px] sm:scroll-mt-[150px]">
            <DaysSection />
          </section>

          <section id="trends" className="scroll-mt-[140px] sm:scroll-mt-[150px]">
            <TrendsSection />
          </section>
        </div>
      </div>
    </div>
  );
}
