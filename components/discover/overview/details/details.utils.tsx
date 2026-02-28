import type { HourlyPoint } from "./details.types";

export const STORAGE_KEY = "meteo:lastRegion";

export function fmtTimeVN(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function toSeriesNext24h(hourly: HourlyPoint[], pick: (p: HourlyPoint) => number | null) {
  const now = new Date();
  const end = new Date(now.getTime() + 24 * 3600 * 1000);

  const pts = hourly
    .map((p) => ({ t: new Date(p.time), v: pick(p) }))
    .filter((x) => !Number.isNaN(x.t.getTime()))
    .filter((x) => x.t >= now && x.t <= end)
    .map((x) => (x.v == null ? null : Number(x.v)))
    .slice(0, 24);

  return pts.length ? pts : [];
}

export function sparkPath(values: Array<number | null>, w = 120, h = 40) {
  const vs = values.filter((v): v is number => typeof v === "number");
  if (!vs.length) return "";

  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const span = Math.max(1e-6, max - min);

  const n = values.length;
  const dx = n <= 1 ? 0 : w / (n - 1);

  const toY = (v: number) => {
    const t = (v - min) / span;
    return h - t * (h - 4) - 2;
  };

  let d = "";
  for (let i = 0; i < n; i++) {
    const v = values[i];
    if (typeof v !== "number") continue;
    const x = i * dx;
    const y = toY(v);
    d += d ? ` L ${x.toFixed(2)} ${y.toFixed(2)}` : `M ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

export function sumRainNext24h(hourly: HourlyPoint[]) {
  const now = new Date();
  const end = new Date(now.getTime() + 24 * 3600 * 1000);
  let s = 0;
  for (const p of hourly) {
    const t = new Date(p.time);
    if (Number.isNaN(t.getTime())) continue;
    if (t < now || t > end) continue;
    const v = p.rain_mm;
    if (typeof v === "number") s += v;
  }
  return s;
}
