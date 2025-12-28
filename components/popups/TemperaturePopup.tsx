"use client";

import React, { useMemo } from "react";
import PopupCard, { Stat } from "../PopupCard";
import { fmt } from "../helpers/popupUtils";

export type DailyPoint = {
  time: string; // "YYYY-MM-DD"
  tmin: number | null;
  tmax: number | null;
};

export type ProvinceWeather = {
  province: { id: number; code: string; name: string };
  coord: { lat: number; lon: number };
  timezone?: string;
  current: { temperature: number | null; time: string | null };
  daily_past_7: DailyPoint[];
  daily_future_7: DailyPoint[];
};

export type TemperaturePopupProps = {
  data: ProvinceWeather | null;
  loading: boolean;
  error: string | null;
  regionName?: string; // ✅ fallback name từ province_index
};

const pickToday = (all: DailyPoint[]) => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const key = `${yyyy}-${mm}-${dd}`;
  return all.find((p) => p.time === key) ?? null;
};

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

const tempDescriptionVN = (t: number) => {
  if (t <= 15) return "Trời lạnh, nên mặc ấm khi ra ngoài.";
  if (t <= 22) return "Thời tiết mát, khá dễ chịu.";
  if (t <= 28) return "Thời tiết ấm, phù hợp hoạt động ngoài trời.";
  if (t <= 33) return "Trời nóng, nên uống đủ nước và tránh nắng gắt.";
  return "Nắng nóng gay gắt, hạn chế ra ngoài giữa trưa và bổ sung nước.";
};

export default function TemperaturePopup({ data, loading, error, regionName }: TemperaturePopupProps) {
  const provinceName = data?.province?.name || regionName || "Không rõ vùng";
  const currentTemp = data?.current?.temperature ?? null;

  const timeText = data?.current?.time
    ? `Cập nhật lúc: ${formatDateTimeVN(data.current.time)}`
    : "Cập nhật lúc: Không rõ";

  const today = useMemo(() => {
    const all = [...(data?.daily_past_7 ?? []), ...(data?.daily_future_7 ?? [])];
    return pickToday(all);
  }, [data]);

  // ✅ icon theo nhiệt độ cao/thấp (giữ như cũ)
  const iconSrc = currentTemp != null && currentTemp >= 28 ? "/high_temp.png" : "/short_temp.png";

  const currentDesc =
    currentTemp == null ? "Chưa có dữ liệu nhiệt độ hiện tại." : tempDescriptionVN(currentTemp);

  return (
    <PopupCard
      icon={<img src={iconSrc} alt="" className="w-6 h-6" draggable={false} />}
      title={provinceName}
      timeText={timeText}
      description={currentDesc}
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
              <div className="text-[28px] font-bold leading-none">
                {currentTemp == null ? "—" : `${fmt(currentTemp, 1)}°C`}
              </div>
            </div>

            <div className="flex gap-4">
              <Stat label="Max" value={today?.tmax == null ? "—" : `${fmt(today.tmax, 0)}°C`} />
              <Stat label="Min" value={today?.tmin == null ? "—" : `${fmt(today.tmin, 0)}°C`} />
            </div>
          </div>
        </div>
      )}
    </PopupCard>
  );
}
