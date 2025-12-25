import type { CurrentWeather } from "./current.types";

export async function fetchCurrentWeather(args: {
  apiBase: string;
  regionCode: string;
  signal?: AbortSignal;
}): Promise<CurrentWeather> {
  const { apiBase, regionCode, signal } = args;

  const url = new URL(`/api/provinces/${regionCode}/current/`, apiBase).toString();
  const res = await fetch(url, { cache: "no-store", signal });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok) {
    const detail = json?.detail || json?.message || text || `HTTP ${res.status}`;
    throw new Error(detail);
  }

  return json as CurrentWeather;
}
