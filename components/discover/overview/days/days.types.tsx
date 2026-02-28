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

export type DailyForecastPoint = {
  date: string; // YYYY-MM-DD
  tmax: number | null;
  tmin: number | null;
  weather_code: number | null;
};

export type DaysVM = {
  region: RegionDetail;
  days: DailyForecastPoint[];
  monthKey: string; 
  monthTabs: Array<{ key: string; label: string; yearLabel?: string }>;
  selectedDate: string | null;

  byDate: Record<string, DailyForecastPoint | undefined>;
};
