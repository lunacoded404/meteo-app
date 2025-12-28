// src/components/discover/overview/trends/trends.types.tsx
export type MetricKey = "temperature" | "precipitation" | "humidity" | "wind";

// ✅ Period dropdown: 12m hoặc năm cụ thể (2025, 2024...)
export type PeriodKey = "12m" | number;

export type RegionDetail = {
  code: string;
  name: string;
  lat: number;
  lon: number;
};

export type RegionEventDetail = {
  code: string;
  name: string;
  lat: number;
  lon: number;
};

export type DailyPoint = {
  date: string; // YYYY-MM-DD
  tmax: number | null;
  tmin: number | null;
  precip: number | null; // mm/day
  wind: number | null; // km/h (wind_speed_10m_max)
  humidity: number | null; // % daily mean computed from hourly
};

export type ClimateInfo = {
  hottest_month: string | null;
  coldest_month: string | null;
  wettest_month: string | null;
  windiest_month: string | null;
};

export type DailySummaryRow = {
  label: string;
  unit: string;
  max: number | null;
  avg: number | null;
  min: number | null;
};

export type TrendsVM = {
  region: RegionDetail;

  // ✅ dropdown period + list years
  period: PeriodKey;
  years: number[]; // ví dụ [2025, 2024, 2023, 2022, 2021, 2020]
  monthFilter: number | "all";

  rangeLabel: string;
  metric: MetricKey;

  daily: DailyPoint[];

  climate_12m: ClimateInfo;
  climate_all: ClimateInfo;

  summaryRows_12m: DailySummaryRow[];
  summaryRows_all: DailySummaryRow[];

  warningText: string | null;
};
