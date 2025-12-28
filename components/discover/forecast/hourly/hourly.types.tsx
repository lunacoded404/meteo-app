export type HourlyPoint = {
  time: string;

  temperature_c: number | null;
  feels_like_c: number | null;

  humidity_percent: number | null;

  rain_mm: number | null;
  rain_prob_percent: number | null;

  cloud_percent: number | null;

  wind_speed: number | null;
  wind_direction_deg: number | null;
  wind_direction_label: string | null;
};

export type BundlePayload = {
  region: { code: string; name: string };
  location: { lat: number; lon: number; timezone?: string | null };
  current: any;
  hourly: HourlyPoint[];
  daily: any[];
  meta?: any;
};
