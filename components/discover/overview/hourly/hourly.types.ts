export type ViewMode = "chart" | "list";

export type RegionDetail = {
  code?: string;
  name: string;
  lat: number;
  lon: number;
};

export type OpenMeteoHourlyResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: {
    time: string[];
    temperature_2m?: number[];
    apparent_temperature?: number[];
    precipitation?: number[]; // mm
    weather_code?: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    sunrise?: string[];
    sunset?: string[];
    weather_code?: number[];
  };
};

export type DaySummary = {
  date: string; // YYYY-MM-DD
  tmin: number | null;
  tmax: number | null;
  wmo: number | null;
};

export type HourRow = {
  time: string; // ISO
  temp: number | null;
  feels: number | null;
  rain_mm: number | null;
  wmo: number | null;
};

export type SelectedDay = {
  rows: HourRow[];
};
