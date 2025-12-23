// src/components/discover/overview/CurrentSection.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MapPin, Thermometer, Wind, Droplets, Cloud, Umbrella, AlertTriangle } from "lucide-react";

import RegionSearch, { ProvinceIndexItem } from "@/components/discover/overview/RegionSearch";

type CurrentWeather = {
  region: { code: string; name: string };
  time: string | null;
  temperature_c: number | null;
  feels_like_c?: number | null;
  wind_kmh?: number | null;
  wind_dir_deg?: number | null;
  humidity_percent?: number | null;
  cloud_percent?: number | null;
  precipitation_mm?: number | null;
  meta?: any;
};

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

function fmtTimeVN(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const hh = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);

  const ddmmyyyy = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);

  return `${hh} • ${ddmmyyyy}`;
}


function describeWeather(d: CurrentWeather | null, loading?: boolean) {
  if (loading) return "Đang tải dữ liệu thời tiết…";
  if (!d) return "Chưa có dữ liệu thời tiết cho khu vực này.";

  const t = d.temperature_c;
  const rain = d.precipitation_mm;
  const cloud = d.cloud_percent;
  const hum = d.humidity_percent;
  const wind = d.wind_kmh;

  // --- helper text ---
  const tempText =
    t == null
      ? "Nhiệt độ hiện chưa rõ."
      : t >= 35
      ? `Thời tiết đang rất nóng, khoảng ${Math.round(t)}°C.`
      : t >= 30
      ? `Thời tiết khá nóng, khoảng ${Math.round(t)}°C.`
      : t >= 24
      ? `Thời tiết dễ chịu, khoảng ${Math.round(t)}°C.`
      : t >= 18
      ? `Thời tiết mát, khoảng ${Math.round(t)}°C.`
      : `Trời khá lạnh, khoảng ${Math.round(t)}°C.`;

  const cloudText =
    cloud == null
      ? ""
      : cloud >= 85
      ? "Bầu trời nhiều mây và khá u ám."
      : cloud >= 55
      ? "Mây rải rác, trời hơi âm u."
      : cloud >= 25
      ? "Trời có mây nhẹ, đôi lúc có nắng."
      : "Trời khá quang mây.";

  // precipitation_mm trong current của Open-Meteo thường là mm tại thời điểm đó (hoặc giờ hiện tại),
  // nên dùng câu mô tả “có thể” thay vì khẳng định mưa cả ngày.
  const rainText =
    rain == null
      ? ""
      : rain >= 10
      ? "Hiện có mưa đáng kể, khả năng đường trơn và tầm nhìn giảm."
      : rain >= 3
      ? "Đang có mưa vừa, bạn nên mang theo áo mưa."
      : rain > 0
      ? "Có mưa nhẹ lác đác."
      : "Hiện tại không có mưa.";

  const humText =
    hum == null
      ? ""
      : hum >= 90
      ? "Độ ẩm rất cao nên có cảm giác oi bức."
      : hum >= 75
      ? "Độ ẩm cao, cảm giác hơi oi."
      : hum >= 55
      ? "Độ ẩm ở mức vừa phải."
      : "Không khí khá khô.";

  const windText =
    wind == null
      ? ""
      : wind >= 35
      ? `Gió khá mạnh khoảng ${Math.round(wind)} km/h, ra ngoài nên chú ý an toàn.`
      : wind >= 18
      ? `Có gió vừa khoảng ${Math.round(wind)} km/h.`
      : `Gió nhẹ khoảng ${Math.round(wind)} km/h.`;

  const parts = [tempText, cloudText, rainText, humText, windText].filter(Boolean);

  // ✅ 1 đoạn dài, mượt như weather app
  return parts.join(" ");
}


function StatusPill({ loading, err }: { loading: boolean; err: string | null }) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] border backdrop-blur";
  if (err) {
    return (
      <span className={cx(base, "bg-rose-500/10 border-rose-400/20 text-rose-100")}>
        <AlertTriangle className="h-3.5 w-3.5" />
        Error
      </span>
    );
  }
  if (loading) {
    return (
      <span className={cx(base, "bg-white/8 border-white/10 text-white/70")}>
        <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-pulse" />
        Loading
      </span>
    );
  }
  return (
    <span className={cx(base, "bg-emerald-500/10 border-emerald-400/20 text-emerald-100")}>
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Live
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div
      className={cx(
        "group rounded-2xl border border-white/10 bg-white/6",
        "px-4 py-3 backdrop-blur-xl",
        "shadow-[0_16px_50px_rgba(0,0,0,0.25)]",
        "transition-transform duration-200 hover:-translate-y-[1px]",
        "hover:bg-white/8"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] text-white/70">
            <span className="opacity-90">{icon}</span>
            <span className="font-medium truncate">{label}</span>
          </div>
          <div className="mt-2 flex items-end gap-1.5">
            <div className="text-[18px] font-semibold text-white tracking-tight">{value}</div>
            {unit ? <div className="text-[12px] text-white/55 mb-[2px]">{unit}</div> : null}
          </div>
        </div>

        <div className="h-10 w-10 rounded-2xl bg-white/8 border border-white/10 grid place-items-center group-hover:bg-white/10 transition-colors">
          <div className="opacity-90">{icon}</div>
        </div>
      </div>
    </div>
  );
}

export default function CurrentSection({
  apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000",
}: {
  apiBase?: string;
}) {
  const [selectedRegion, setSelectedRegion] = useState<ProvinceIndexItem>({
    code: "79",
    name: "TP.Hồ Chí Minh",
  });

  const [data, setData] = useState<CurrentWeather | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedRegion?.code) return;

    const ctrl = new AbortController();
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const url = new URL(`/api/provinces/${selectedRegion.code}/current/`, apiBase).toString();
        const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });

        const text = await res.text();
        let json: any = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {}

        if (!res.ok) {
          const detail = json?.detail || json?.message || text || `HTTP ${res.status}`;
          throw new Error(detail);
        }

        setData(json as CurrentWeather);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setErr(e?.message || "Fetch failed");
        setData(null);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [apiBase, selectedRegion.code]);

  const title = data?.region?.name || selectedRegion?.name || "TP.Hồ Chí Minh";
  const updated = useMemo(() => fmtTimeVN(data?.time ?? null), [data?.time]);
  const desc = useMemo(() => describeWeather(data, loading), [data, loading]);

return (
  <section
    className={cx(
      "rounded-[28px] border border-white/10",
      "bg-gradient-to-b from-[#1f3a66]/80 via-[#1a2f54]/70 to-[#12213e]/70",
      "backdrop-blur-2xl",
      "shadow-[0_22px_80px_rgba(0,0,0,0.45)]",
      "p-5 md:p-6"
    )}
  >
    {/* Top bar */}
    <div className="flex items-start justify-between gap-4">
      {/* Left: location + meta */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 text-white/95">
            <MapPin className="h-4 w-4" />
            <h2 className="text-[16px] md:text-[18px] font-semibold truncate max-w-[62vw]">
              {title}
            </h2>
          </div>

          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/70">
            Current
          </span>

          <StatusPill loading={loading} err={err} />
        </div>

        <div className="mt-1 text-[12px] text-white/70">
          {loading ? "Đang tải…" : updated}
        </div>
      </div>

      {/* Right: compact search + source */}
      <div className="hidden md:flex items-center gap-3">
        <div className="w-[320px]">
          {/* RegionSearch tự có UI rồi, mình chỉ bóp nhỏ bằng wrapper */}
          <RegionSearch apiBase={apiBase} value={selectedRegion} onChange={setSelectedRegion} />
        </div>
        <div className="text-[11px] text-white/55 whitespace-nowrap">Nguồn: Open-Meteo</div>
      </div>
    </div>

    {/* Mobile search */}
    <div className="mt-3 md:hidden">
      <RegionSearch apiBase={apiBase} value={selectedRegion} onChange={setSelectedRegion} />
      <div className="mt-2 text-[11px] text-white/55">
        Gõ tên • ↑↓ chọn • Enter để chọn • Esc để đóng
      </div>
    </div>

    {/* Hero: temperature */}
    <div
      className={cx(
        "mt-5 rounded-3xl border border-white/10",
        "bg-white/8 backdrop-blur-xl",
        "shadow-[0_18px_60px_rgba(0,0,0,0.35)]",
        "p-5 md:p-6 relative overflow-hidden"
      )}
    >
      {/* glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-28 h-72 w-72 rounded-full bg-white/8 blur-3xl" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* left block: icon + big temp */}
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-3xl bg-white/10 border border-white/10 grid place-items-center overflow-hidden shrink-0">
            <img src="/weather.png" alt="" className="h-12 w-12 md:h-14 md:w-14 object-contain opacity-95" />
          </div>

          <div className="min-w-0">
            <div className="flex items-end gap-3">
              <div className="text-[64px] md:text-[84px] leading-none font-semibold text-white tracking-tight">
                {data?.temperature_c == null ? "—" : Math.round(data.temperature_c)}
              </div>
              <div className="pb-2 md:pb-3 text-[18px] md:text-[22px] text-white/75">°C</div>
            </div>

            {/* short status line like the sample */}
            <div className="mt-1 text-[16px] md:text-[18px] font-semibold text-white/90">
              {(() => {
                const t = data?.temperature_c;
                if (t == null) return "—";
                if (t >= 33) return "Nóng";
                if (t >= 28) return "Khá nóng";
                if (t >= 22) return "Dễ chịu";
                if (t >= 16) return "Mát";
                return "Lạnh";
              })()}
              {data?.cloud_percent != null ? (
                <span className="ml-2 text-white/70 font-medium text-[14px] md:text-[15px]">
                  • {data.cloud_percent >= 75 ? "Nhiều mây" : data.cloud_percent >= 40 ? "Mây rải rác" : "Ít mây"}
                </span>
              ) : null}
            </div>

            {/* description (1 line) */}
            <div className="mt-1 text-[13px] md:text-[14px] text-white/70 max-w-[64ch]">
              {desc}
            </div>
          </div>
        </div>

        {/* right block: small pills */}
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {data?.meta?.wind_direction_label ? (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-white/75">
              Hướng gió: <span className="text-white/90 font-medium">{String(data.meta.wind_direction_label)}</span>
            </span>
          ) : null}

          {data?.meta?.timezone ? (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-white/75">
              TZ: <span className="text-white/90 font-medium">{String(data.meta.timezone)}</span>
            </span>
          ) : null}

          {/* <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-white/75">
            Mã: <span className="text-white/90 font-medium">{selectedRegion.code}</span>
          </span> */}
        </div>
      </div>

      {/* error banner */}
      {err ? (
        <div className="relative mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-100">
          {err}
        </div>
      ) : null}
    </div>

    {/* Bottom stats row (like the sample) */}
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
      <StatCard
        icon={<Wind className="h-4 w-4" />}
        label="Gió"
        value={data?.wind_kmh == null ? "—" : String(Math.round(data.wind_kmh))}
        unit="km/h"
      />
      <StatCard
        icon={<Droplets className="h-4 w-4" />}
        label="Độ ẩm"
        value={data?.humidity_percent == null ? "—" : String(Math.round(data.humidity_percent))}
        unit="%"
      />
      <StatCard
        icon={<Cloud className="h-4 w-4" />}
        label="Mây"
        value={data?.cloud_percent == null ? "—" : String(Math.round(data.cloud_percent))}
        unit="%"
      />
      <StatCard
        icon={<Umbrella className="h-4 w-4" />}
        label="Mưa"
        value={data?.precipitation_mm == null ? "—" : Number(data.precipitation_mm).toFixed(1)}
        unit="mm"
      />
    </div>
  </section>
);

}
