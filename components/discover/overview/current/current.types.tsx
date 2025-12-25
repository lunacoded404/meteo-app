export type CurrentWeather = {
  region: { code: string; name: string };
  time: string | null;
  temperature_c: number | null;
  feels_like_c?: number | null;
  wind_kmh?: number | null;
  wind_dir_deg?: number | null;
  humidity_percent?: number | null;
  cloud_percent?: number | null;
  precipitation_mm?: number | null;
  meta?: any;
};
