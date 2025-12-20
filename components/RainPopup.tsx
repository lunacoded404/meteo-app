"use client";

import React from "react";
import PopupCard, { Stat } from "./PopupCard";
import { fmt, clamp } from "./helpers/popupUtils";

export type DailyRainPoint = {
  date: string; // "YYYY-MM-DD"
  precipitation_sum_mm: number | null;
  precipitation_probability_max: number | null;
};

export type ProvinceRain = {
  province: { id: number; code: string; name: string };
  coord: { lat: number; lon: number };
  timezone?: string;
  current: {
    precipitation_mm: number | null;
    precipitation_probability: number | null;
    time: string | null;
  };
  daily: {
    points: DailyRainPoint[];
  };
};

export type RainPopupProps = {
  data: ProvinceRain | null;
  loading: boolean;
  error: string | null;
};

// ✅ format: HH:mm • dd/MM/yyyy
const formatDateTimeVN = (iso?: string | null) => {
  if (!iso) return "Không rõ";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${hh}:${mi} • ${dd}/${mm}/${yyyy}`;
};

const rainDescriptionVN = (mmNow: number | null, probNow: number | null) => {
  if (mmNow == null && probNow == null) return "Chưa có dữ liệu mưa hiện tại.";

  const mm = mmNow ?? 0;
  const p = probNow ?? 0;

  // Ưu tiên “đang mưa” nếu lượng mưa > 0
  if (mm >= 5) return "Mưa khá lớn, nên mang áo mưa và hạn chế di chuyển xa.";
  if (mm >= 1) return "Đang có mưa nhẹ, nên chuẩn bị áo mưa/ô khi ra ngoài.";
  if (p >= 80) return "Khả năng mưa rất cao, nên mang ô/áo mưa.";
  if (p >= 50) return "Có khả năng mưa, nên theo dõi bầu trời và chuẩn bị ô.";
  if (p >= 20) return "Khả năng mưa thấp, thời tiết có thể thay đổi nhẹ.";
  return "Hầu như không mưa, thời tiết tương đối ổn định.";
};

export default function RainPopup({ data, loading, error }: RainPopupProps) {
  const provinceName = data?.province?.name ?? "Không rõ vùng";

  const mmNow = data?.current?.precipitation_mm ?? null;
  const probNow = data?.current?.precipitation_probability ?? null;

  const timeText = `Cập nhật lúc: ${formatDateTimeVN(data?.current?.time)}`;

  const probBar = probNow == null ? 0 : clamp(probNow, 0, 100);
  const desc = rainDescriptionVN(mmNow, probNow);

  return (
    <PopupCard
      icon={
        <img
          src="/umbrella.png"
          alt=""
          className="w-6 h-6"
          draggable={false}
        />
      }
      title={`${provinceName}`}
      timeText={timeText}
      description={desc}
      loading={loading}
      error={error}
    >
      {!data ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-[12px] text-slate-600 whitespace-normal break-words">
            Chưa có dữ liệu. Hãy chọn một tỉnh để xem.
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500">Hiện tại</div>
              <div className="text-[26px] font-bold leading-none">
                {mmNow == null ? "—" : `${fmt(mmNow, 1)} mm`}
              </div>
            </div>

            <div className="flex gap-4">
              <Stat
                label="Xác suất mưa"
                value={probNow == null ? "—" : `${fmt(probNow, 0)}%`}
                sub={
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-24 rounded-full bg-slate-200 overflow-hidden">
                      <span
                        className="block h-full bg-slate-900"
                        style={{ width: `${probBar}%` }}
                      />
                    </span>
                    <span className="text-[11px] text-slate-500">{probBar}%</span>
                  </span>
                }
              />
            </div>
          </div>
        </div>
      )}
    </PopupCard>
  );
}
