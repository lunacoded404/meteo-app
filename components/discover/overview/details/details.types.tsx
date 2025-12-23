// src/components/discover/overview/details/details.types.tsx
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

export type HourlyPoint = {
  time: string;
  temperature_c: number | null;
  feels_like_c: number | null;
  humidity_percent: number | null;
  rain_mm: number | null;
  cloud_percent: number | null;
  wind_speed: number | null;
  wind_direction_deg: number | null;
  wind_direction_label: string | null;
};

export type BundlePayload = {
  region?: { code: string; name: string };
  location?: { lat?: number; lon?: number; timezone?: string };
  current?: {
    time?: string | null;
    temperature_c?: number | null;
    feels_like_c?: number | null;
    humidity_percent?: number | null;
    rain_mm?: number | null;
    cloud_percent?: number | null;
    wind_speed?: number | null;
    wind_direction_deg?: number | null;
    wind_direction_label?: string | null;
  };
  hourly?: HourlyPoint[];
};

export type DetailsVM = {
  region: RegionDetail;
  timeText: string;
  current: NonNullable<BundlePayload["current"]>;
  tempPath: string;
  feelsPath: string;
  cloudPath: string;
  rain24sum: number;
};
