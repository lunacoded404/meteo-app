"use client";

import React from "react";
import PopupCard, { Stat } from "../PopupCard";
import { fmt, windDirLabelVN } from "../helpers/popupUtils";

export type WindRoseSector = {
  dir_label: string; // ví dụ: "N", "NE", "E"...
  count: number;     // tần suất
  // có thể có thêm field nếu backend trả về
  dir_deg?: number;
};

export type ProvinceWind = {
  province: { id: number; code: string; name: string };
  coord: { lat: number; lon: number };
  current: {
    wind_speed_kmh: number | null;
    wind_direction_deg: number | null;
    time: string | null;
  };
  rose_period_hours?: number;
  rose?: any[];
};

export type WindPopupProps = {
  data: ProvinceWind | null;
  loading: boolean;
  error: string | null;
  regionName?: string;
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

const windDescriptionVN = (kmh: number) => {
  if (kmh < 6) return "Gió nhẹ, hầu như không ảnh hưởng.";
  if (kmh < 20) return "Gió vừa, cảm nhận rõ khi ra ngoài trời.";
  if (kmh < 35) return "Gió mạnh, lưu ý khi đi xe máy hoặc ngoài trời.";
  if (kmh < 55) return "Gió rất mạnh, hạn chế hoạt động ngoài trời nếu có thể.";
  return "Gió giật mạnh, cần đặc biệt cẩn trọng (ven biển/đồi núi).";
};

export default function WindPopup({ data, loading, error, regionName }: WindPopupProps) {
  const provinceName = data?.province?.name || regionName || "Không rõ vùng";

  const spd = data?.current?.wind_speed_kmh ?? null;
  const dir = data?.current?.wind_direction_deg ?? null;

  const timeText = `Cập nhật lúc: ${formatDateTimeVN(data?.current?.time)}`;
  const desc = spd == null ? "Chưa có dữ liệu gió hiện tại." : windDescriptionVN(spd);

  return (
    <PopupCard
      icon={<img src="/wind.png" alt="" className="w-6 h-6" draggable={false} />}
      title={provinceName}
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
              <div className="text-[11px] text-slate-500">Tốc độ</div>
              <div className="text-[28px] font-bold leading-none">
                {spd == null ? "—" : `${fmt(spd, 0)} km/h`}
              </div>
            </div>

            <div className="flex gap-4">
              <Stat label="Hướng gió" value={windDirLabelVN(dir)} />
            </div>
          </div>
        </div>
      )}
    </PopupCard>
  );
}
