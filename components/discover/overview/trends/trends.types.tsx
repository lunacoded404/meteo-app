export type MetricKey = "temperature" | "precipitation" | "humidity" | "wind";

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
  precip: number | null; 
  wind: number | null; 
  humidity: number | null; 
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
  period: PeriodKey;
  years: number[]; 
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
