"use client";

import React, { useMemo, useState } from "react";
import type { HourlyPoint } from "./hourly.types";
import { groupHourlyByDay, localYMD, pick24Hours, fmtDateVN } from "./hourly.utils";

import TempHourlyPanel from "./panels/TempHourlyPanel";
import HumidityHourlyPanel from "./panels/HumidityHourlyPanel";
import WindHourlyPanel from "./panels/WindHourlyPanel";
import CloudHourlyPanel from "./panels/CloudHourlyPanel";
import RainHourlyPanel from "./panels/RainHourlyPanel";

export default function HourlyCharts({
  points,
  scrollOffsetPx = 120,
}: {
  points: HourlyPoint[];
  scrollOffsetPx?: number;
}) {
  const dayMap = useMemo(() => groupHourlyByDay(points ?? []), [points]);

  const days = useMemo(() => {
    const keys = Array.from(dayMap.keys()).sort(); // YYYY-MM-DD
    const today = localYMD();
    // lấy từ hôm nay trở đi (tối đa 7 ngày)
    const forward = keys.filter((d) => d >= today).slice(0, 7);
    // nếu thiếu (do data có thể bắt đầu trước hôm nay), lấy thêm các ngày gần nhất
    if (forward.length >= 1) return forward;
    return keys.slice(0, 7);
  }, [dayMap]);

  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const today = localYMD();
    return days.includes(today) ? today : days[0] ?? today;
  });

  // khi days thay đổi (lần đầu load), đảm bảo selectedDay hợp lệ
  React.useEffect(() => {
    if (!days.length) return;
    const today = localYMD();
    setSelectedDay((prev) => (days.includes(prev) ? prev : days.includes(today) ? today : days[0]));
  }, [days]);

  const dayPoints24 = useMemo(() => {
    const arr = dayMap.get(selectedDay) ?? [];
    return pick24Hours(arr);
  }, [dayMap, selectedDay]);

  return (
    <div style={{ ["--fp-offset" as any]: `${scrollOffsetPx}px` }} className="grid grid-cols-1 gap-4">
      {/* ✅ combobox chọn ngày */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-[13px] text-slate-300">
            Chọn ngày (24 giờ):
            <span className="ml-2 text-white/90 font-semibold">{fmtDateVN(selectedDay)}</span>
          </div>

          <div className="w-full md:w-[260px]">
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-slate-100 outline-none hover:bg-white/10"
            >
              {days.map((d) => (
                <option key={d} value={d} className="bg-slate-900">
                  {fmtDateVN(d)} ({d})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ✅ panels (mỗi panel hiển thị 24h của selectedDay) */}
      <TempHourlyPanel points={dayPoints24} day={selectedDay} />
      <HumidityHourlyPanel points={dayPoints24} day={selectedDay} />
      <WindHourlyPanel points={dayPoints24} day={selectedDay} />
      <CloudHourlyPanel points={dayPoints24} day={selectedDay} />
      <RainHourlyPanel points={dayPoints24} day={selectedDay} />
    </div>
  );
}
