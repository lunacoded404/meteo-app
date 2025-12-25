export type DailyPoint = {
  date: string;

  tmax_c: number | null;
  tmin_c: number | null;

  humidity_mean_percent?: number | null;
  cloud_mean_percent?: number | null;

  wind_speed_max_kmh?: number | null;
  wind_direction_dominant_deg?: number | null;
  wind_direction_dominant_label?: string | null;

  rain_sum_mm?: number | null;
  rain_prob_max_percent?: number | null;
};

export type DailyRow = {
  date: string;
  label: string;

  tmax: number | null;
  tmin: number | null;

  hum: number | null;
  cloud: number | null;

  wind: number | null;
  windDir: number | null;
  windDirLabel: string | null;

  rain: number | null;
  rainProb: number | null;
};
