// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import OverviewFloatingPanel from "@/components/discover/overview/OverviewFloatingPanel";
// import CurrentSection from "@/components/discover/overview/CurrentSection";
// import HourlySection from "@/components/discover/overview/HourlySection";
// import DetailsSection from "@/components/discover/overview/DetailsSection";
// import MapsSection from "@/components/discover/overview/MapsSection";
// import DaysSection from "@/components/discover/overview/DaysSection";
// import TrendsSection from "@/components/discover/overview/TrendsSection";

// import ProvinceSearchBar from "@/components/ProvinceSearchBar";
// import type { ProvinceIndexItem } from "@/components/discover/overview/RegionSearch";

// // ✅ payload list nhẹ: /api/province-index/
// const RAW_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");
// const API_BASE = RAW_BASE.endsWith("/api") ? RAW_BASE : `${RAW_BASE}/api`;

// const STORAGE_KEY = "meteo:lastRegion";
// const INDEX_CACHE_KEY = "meteo:provinceIndex:v1";

// // ✅ Default luôn là TP.HCM
// const DEFAULT_HCM: ProvinceIndexItem = {
//   code: "79",
//   name: "TP.Hồ Chí Minh",
//   centroid: { lat: 10.8231, lon: 106.6297 },
// };

// function safeParseJSON<T>(s: string | null): T | null {
//   if (!s) return null;
//   try {
//     return JSON.parse(s) as T;
//   } catch {
//     return null;
//   }
// }

// // ✅ bắn event để các section đang dùng "meteo:region" nhận được
// function emitRegion(it: ProvinceIndexItem) {
//   const lat = Number(it?.centroid?.lat);
//   const lon = Number(it?.centroid?.lon);

//   window.dispatchEvent(
//     new CustomEvent("meteo:region", {
//       detail: {
//         code: it.code,
//         name: it.name,
//         lat: Number.isFinite(lat) ? lat : DEFAULT_HCM.centroid!.lat,
//         lon: Number.isFinite(lon) ? lon : DEFAULT_HCM.centroid!.lon,
//       },
//     })
//   );
// }

// export default function OverviewPage() {
//   const [selected, setSelected] = useState<ProvinceIndexItem>(DEFAULT_HCM);

//   const [items, setItems] = useState<ProvinceIndexItem[]>([]);
//   const [loadingList, setLoadingList] = useState(true);
//   const [err, setErr] = useState<string | null>(null);

//   // ✅ tránh override selection nếu user đã chọn trước khi fetch xong
//   const userSelectedRef = useRef(false);

//   // 1) Load provinces list (JSON nhẹ + cache local)
//   useEffect(() => {
//     let alive = true;

//     (async () => {
//       try {
//         setLoadingList(true);

//         // ✅ (A) render tức thì từ localStorage
//         const cachedRaw = localStorage.getItem(INDEX_CACHE_KEY);
//         if (cachedRaw) {
//           const cached = safeParseJSON<{ items: ProvinceIndexItem[] }>(cachedRaw);
//           const cachedItems =
//             (cached?.items ?? []).filter(
//               (x) => x?.code && x?.name && x?.centroid?.lat != null && x?.centroid?.lon != null
//             ) || [];

//           if (alive && cachedItems.length) {
//             setItems(cachedItems);

//             // restore selection từ localStorage
//             const saved = safeParseJSON<ProvinceIndexItem>(localStorage.getItem(STORAGE_KEY));
//             const found =
//               (saved?.code ? cachedItems.find((p) => p.code === saved.code) : null) ??
//               cachedItems.find((p) => p.code === "79") ??
//               DEFAULT_HCM;

//             if (!userSelectedRef.current) {
//               setSelected(found);
//               // ✅ emit để các section cập nhật ngay
//               emitRegion(found);
//             }
//           }
//         }

//         // ✅ (B) fetch list nhẹ từ backend
//         const res = await fetch(`${API_BASE}/province-index/`, { cache: "no-store" });
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const json = (await res.json()) as { items: ProvinceIndexItem[] };

//         const arr =
//           (json?.items ?? []).filter(
//             (x) => x?.code && x?.name && x?.centroid?.lat != null && x?.centroid?.lon != null
//           ) || [];

//         if (!alive) return;

//         setItems(arr);
//         localStorage.setItem(INDEX_CACHE_KEY, JSON.stringify({ items: arr }));

//         // ✅ restore selection theo list mới (nhưng không override nếu user đã chọn)
//         const saved = safeParseJSON<ProvinceIndexItem>(localStorage.getItem(STORAGE_KEY));
//         const found =
//           (saved?.code ? arr.find((p) => p.code === saved.code) : null) ??
//           arr.find((p) => p.code === "79") ??
//           DEFAULT_HCM;

//         if (!userSelectedRef.current) {
//           setSelected(found);
//           emitRegion(found);
//         }
//       } catch (e: any) {
//         if (!alive) return;
//         setItems([DEFAULT_HCM]);
//         setSelected(DEFAULT_HCM);
//         setErr(e?.message ?? "Không tải được danh sách tỉnh/thành");
//         emitRegion(DEFAULT_HCM);
//       } finally {
//         if (alive) setLoadingList(false);
//       }
//     })();

//     return () => {
//       alive = false;
//     };
//   }, []);

//   // 2) Khi selected đổi (do user chọn), lưu + emit
//   useEffect(() => {
//     if (!selected?.code) return;
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
//     emitRegion(selected);
//   }, [selected?.code]);

//   return (
//     <div className="relative min-h-screen">


//       <div className="pointer-events-none absolute inset-0 -z-10">
//         <div className="absolute inset-0 bg-gradient-to-b from-[#0b0614] via-gray-900 to-black/90" />
//         <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-fuchsia-500/10 blur-3xl" />
//         <div className="absolute top-48 left-10 h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl" />
//         <div className="absolute bottom-0 right-10 h-[360px] w-[360px] rounded-full bg-amber-400/10 blur-3xl" />
//       </div>

//       <div className="mx-auto w-full max-w-[1400px] px-3 md:px-6 pb-10">
//         <div className="relative min-h-[calc(100vh-108px)]">
//           <OverviewFloatingPanel />

//           <main className="relative z-10 md:pl-[220px] py-6 space-y-6">
//             {/* ✅ Search bar */}
//             <div className="sticky top-[96px] z-40 -mx-3 md:-mx-6 px-3 md:px-6 pb-3 pt-2 backdrop-blur bg-gray-900/70">
//               <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
//                 <div>
//                   <div className="text-[18px] font-semibold text-white">TỔNG QUAN</div>
//                   <div className="text-[13px] text-slate-300">
//                     {selected ? `${selected.name}` : "TP.Hồ Chí Minh"}
//                   </div>
//                 </div>

//                 <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
//                   <div className="w-full md:w-[420px] pointer-events-auto">
//                     <ProvinceSearchBar
//                       items={items.length ? items : [DEFAULT_HCM]}
//                       placeholder={loadingList ? "Đang tải danh sách..." : "Tìm tỉnh/thành..."}
//                       onSelect={(it) => {
//                         userSelectedRef.current = true;
//                         setSelected(it);
//                       }}
//                     />
//                   </div>
//                 </div>
//               </div>

//               {err ? (
//                 <div className="mt-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-rose-200">
//                   Lỗi: {err}
//                 </div>
//               ) : null}
//             </div>


//             {/* ✅ Sections giữ nguyên */}
//             <section id="current" className="scroll-mt-28">
//               <CurrentSection />
//             </section>

//             <section id="hourly" className="scroll-mt-28">
//               <HourlySection />
//             </section>

//             <section id="details" className="scroll-mt-28">
//               <DetailsSection />
//             </section>

//             <section id="maps" className="scroll-mt-28">
//               <MapsSection />
//             </section>

//             <section id="monthly" className="scroll-mt-28">
//               <DaysSection />
//             </section>

//             <section id="trends" className="scroll-mt-28">
//               <TrendsSection />
//             </section>
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// }


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

// ✅ payload list nhẹ: /api/province-index/
const RAW_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");
const API_BASE = RAW_BASE.endsWith("/api") ? RAW_BASE : `${RAW_BASE}/api`;

const STORAGE_KEY = "meteo:lastRegion";
const INDEX_CACHE_KEY = "meteo:provinceIndex:v1";

// ✅ Default luôn là TP.HCM
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

// ✅ bắn event để các section đang dùng "meteo:region" nhận được
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

  // ✅ tránh override selection nếu user đã chọn trước khi fetch xong
  const userSelectedRef = useRef(false);

  // 1) Load provinces list (JSON nhẹ + cache local)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingList(true);

        // ✅ (A) render tức thì từ localStorage
        const cachedRaw = localStorage.getItem(INDEX_CACHE_KEY);
        if (cachedRaw) {
          const cached = safeParseJSON<{ items: ProvinceIndexItem[] }>(cachedRaw);
          const cachedItems =
            (cached?.items ?? []).filter(
              (x) => x?.code && x?.name && x?.centroid?.lat != null && x?.centroid?.lon != null
            ) || [];

          if (alive && cachedItems.length) {
            setItems(cachedItems);

            // restore selection từ localStorage
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

  // 2) Khi selected đổi (do user chọn), lưu + emit
  useEffect(() => {
    if (!selected?.code) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    emitRegion(selected);
  }, [selected?.code]);

  return (
    <div className="relative">
      {/* ✅ Background giống Hourly: nhẹ + đơn giản */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0614] via-gray-900 to-black/90" />
      </div>

      {/* ✅ Container giống Hourly */}
      <div className="mx-auto max-w-6xl px-4 pb-10">
        {/* ✅ Floating panel (giữ) */}
        <OverviewFloatingPanel />

        <div className="sticky top-[96px] z-40">
          {/* lớp nền tràn ra ngoài theo padding container */}
          <div className="-mx-3 md:-mx-6 px-3 md:px-6 pb-3 pt-2">
            {/* nền blur + border mềm giống Hourly/Daily */}
            <div className="rounded-2xl border border-white/10 bg-gray-900/70 backdrop-blur">
              <div className="px-4 py-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="text-[18px] font-semibold text-white">TỔNG QUAN</div>
                    <div className="text-[13px] text-slate-300">
                      {selected ? `${selected.name}` : "TP.Hồ Chí Minh"}
                    </div>
                  </div>

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


        {/* ✅ Content flow giống Hourly: sections xếp dọc */}
        <div className="mt-4 space-y-6">
          <section id="current" className="scroll-mt-28">
            <CurrentSection />
          </section>

          <section id="hourly" className="scroll-mt-28">
            <HourlySection />
          </section>

          <section id="details" className="scroll-mt-28">
            <DetailsSection />
          </section>

          <section id="maps" className="scroll-mt-28">
            <MapsSection />
          </section>

          <section id="monthly" className="scroll-mt-28">
            <DaysSection />
          </section>

          <section id="trends" className="scroll-mt-28">
            <TrendsSection />
          </section>
        </div>
      </div>
    </div>
  );
}
