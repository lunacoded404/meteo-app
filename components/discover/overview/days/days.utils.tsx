// src/components/discover/overview/days/days.utils.tsx
import type { DailyForecastPoint, RegionDetail } from "./days.types";

export const STORAGE_KEY = "meteo:lastRegion";

export const DEFAULT_REGION: RegionDetail = {
  code: "79",
  name: "TP.Hồ Chí Minh",
  lat: 10.8231,
  lon: 106.6297,
};

export function ymd(d: Date) {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function monthKeyOf(dateStr: string) {
  return dateStr.slice(0, 7); // YYYY-MM
}

export type MonthTab = { key: string; label: string; yearLabel?: string };

function monthLabelVI(monthKey: string) {
  const [yy, mm] = monthKey.split("-").map(Number);
  const d = new Date(yy, (mm || 1) - 1, 1);
  if (Number.isNaN(d.getTime())) return monthKey;
  // Ví dụ: "Tháng 1" / "Tháng 2" ...
  return d.toLocaleDateString("vi-VN", { month: "long" });
}

// ✅ Chỉ tạo tabs theo đúng các tháng xuất hiện trong 16 ngày forecast
export function buildMonthTabsFromDays(days: DailyForecastPoint[]): MonthTab[] {
  const keys = Array.from(new Set(days.map((d) => monthKeyOf(d.date))))
    .filter(Boolean)
    .sort(); // tăng dần: 2025-12, 2026-01 ...

  const out: MonthTab[] = [];
  let lastYear: string | null = null;

  for (const k of keys) {
    const year = k.slice(0, 4);
    const label = monthLabelVI(k);

    const yearChanged = lastYear !== null && year !== lastYear;
    if (lastYear === null) lastYear = year;

    out.push({
      key: k,
      label,
      // MSN-style: chỉ hiện năm khi qua năm mới (hoặc bạn muốn luôn hiện thì đổi thành year)
      yearLabel: yearChanged ? year : undefined,
    });

    lastYear = year;
  }

  return out;
}

export function makeByDate(days: DailyForecastPoint[]) {
  const m: Record<string, DailyForecastPoint> = {};
  for (const d of days) m[d.date] = d;
  return m;
}

export function codeToKind(code: number | null): "sun" | "cloud" | "rain" | "snow" | "storm" | "fog" {
  if (code == null) return "cloud";
  if (code === 0) return "sun";
  if (code === 1 || code === 2 || code === 3) return "cloud";
  if (code >= 45 && code <= 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 95) return "storm";
  return "cloud";
}
