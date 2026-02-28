import type { DailyPoint, MetricKey } from "./trends.types";

export const STORAGE_KEY = "meteo:lastRegion";

export const DEFAULT_REGION = {
  code: "79",
  name: "TP.Hồ Chí Minh",
  lat: 10.8231,
  lon: 106.6297,
};

export function ymd(d: Date) {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function monthName(m: number) {
  const names = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
  return names[m - 1] ?? String(m);
}

export function movingAvg(vals: Array<number | null>, win = 30) {
  const out: Array<number | null> = new Array(vals.length).fill(null);
  let sum = 0;
  let cnt = 0;
  const q: Array<number | null> = [];

  for (let i = 0; i < vals.length; i++) {
    const v = vals[i];
    q.push(v);
    if (typeof v === "number") { sum += v; cnt += 1; }

    if (q.length > win) {
      const rm = q.shift();
      if (typeof rm === "number") { sum -= rm; cnt -= 1; }
    }
    out[i] = cnt ? sum / cnt : null;
  }
  return out;
}

export function pickMetric(dp: DailyPoint, k: MetricKey) {
  if (k === "temperature") return dp.tmax;        
  if (k === "precipitation") return dp.precip;
  if (k === "humidity") return dp.humidity;
  return dp.wind;
}

export function stat(vals: Array<number | null>) {
  const xs = vals.filter((v): v is number => typeof v === "number");
  if (!xs.length) return { max: null, min: null, avg: null };
  let s = 0;
  for (const v of xs) s += v;
  return { max: Math.max(...xs), min: Math.min(...xs), avg: s / xs.length };
}

export function monthOf(dateStr: string) {
  // YYYY-MM-DD
  const m = Number(dateStr.slice(5, 7));
  return Number.isFinite(m) ? m : 0;
}

export function computeClimateInfo(daily: DailyPoint[]) {
  const byMonth = new Map<number, { tmax: number; tmin: number; precip: number; wind: number; n: number }>();

  for (const d of daily) {
    const m = monthOf(d.date);
    if (!m) continue;
    const cur = byMonth.get(m) ?? { tmax: 0, tmin: 0, precip: 0, wind: 0, n: 0 };
    cur.n += 1;
    if (typeof d.tmax === "number") cur.tmax += d.tmax;
    if (typeof d.tmin === "number") cur.tmin += d.tmin;
    if (typeof d.precip === "number") cur.precip += d.precip;
    if (typeof d.wind === "number") cur.wind += d.wind;
    byMonth.set(m, cur);
  }

  let hottest: { m: number; v: number } | null = null;
  let coldest: { m: number; v: number } | null = null;
  let wettest: { m: number; v: number } | null = null;
  let windiest: { m: number; v: number } | null = null;

  for (const [m, agg] of byMonth.entries()) {
    if (!agg.n) continue;

    const tmaxAvg = agg.tmax / agg.n;
    const tminAvg = agg.tmin / agg.n;
    const precipSum = agg.precip; 
    const windAvg = agg.wind / agg.n;

    if (!hottest || tmaxAvg > hottest.v) hottest = { m, v: tmaxAvg };
    if (!coldest || tminAvg < coldest.v) coldest = { m, v: tminAvg };
    if (!wettest || precipSum > wettest.v) wettest = { m, v: precipSum };
    if (!windiest || windAvg > windiest.v) windiest = { m, v: windAvg };
  }

  return {
    hottest_month: hottest ? monthName(hottest.m) : null,
    coldest_month: coldest ? monthName(coldest.m) : null,
    wettest_month: wettest ? monthName(wettest.m) : null,
    windiest_month: windiest ? monthName(windiest.m) : null,
  };
}

export function computeWarning(daily: DailyPoint[], metric: MetricKey) {
  if (daily.length < 90) return null;

  const vals = daily.map((d) => pickMetric(d, metric));
  const last60 = vals.slice(-60);
  const prev30 = last60.slice(0, 30);
  const last30 = last60.slice(30);

  const a = stat(prev30).avg;
  const b = stat(last30).avg;
  if (a == null || b == null) return null;

  const diff = b - a;

  const name =
    metric === "temperature" ? "Nhiệt độ"
    : metric === "precipitation" ? "Lượng mưa"
    : metric === "humidity" ? "Độ ẩm"
    : "Gió";

  const unit =
    metric === "temperature" ? "°C"
    : metric === "precipitation" ? "mm"
    : metric === "humidity" ? "%"
    : "km/h";

  const sign = diff > 0 ? "tăng" : diff < 0 ? "giảm" : "ổn định";
  const mag = Math.abs(diff);

  if (mag < (metric === "precipitation" ? 1.0 : 0.3)) return `${name} đang khá ổn định trong 30 ngày gần đây.`;

  return `${name} đang ${sign} khoảng ${mag.toFixed(metric === "humidity" ? 0 : 1)} ${unit} so với 30 ngày trước.`;
}
