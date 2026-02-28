"use client";
import dynamic from "next/dynamic";

const MapClient = dynamic(() => import("@/components/map/MapClient"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full grid place-items-center text-white/75 text-[13px]">
      Đang tải bản đồ...
    </div>
  ),
});

export default function MapsSection() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.35)] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10">
        <div className="text-white text-[20px] font-semibold">Bản đồ thời tiết</div>
      </div>

      <div className="relative h-[72vh] min-h-[520px] w-full">
        <div className="absolute inset-0">
          <MapClient />
        </div>
      </div>
    </section>
  );
}
