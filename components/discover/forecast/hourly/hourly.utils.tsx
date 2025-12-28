export function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export function fmtHourLabelVN(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function fmtDateVN(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

export function fmtDateTimeVN(iso?: string | null) {
  if (!iso) return "—";
  return `${fmtDateVN(iso)} ${fmtHourLabelVN(iso)}`;
}

/** YYYY-MM-DD theo local time (Asia/Ho_Chi_Minh của browser) */
export function localYMD(d = new Date()) {
  // en-CA => YYYY-MM-DD
  return d.toLocaleDateString("en-CA");
}

export function numCell(v: number | null | undefined, unit?: string) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  const s = Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
  return unit ? `${s} ${unit}` : s;
}

/** Gom hourly points theo ngày YYYY-MM-DD (lấy từ time string của Open-Meteo) */
export function groupHourlyByDay<T extends { time: string }>(points: T[]) {
  const map = new Map<string, T[]>();
  for (const p of points ?? []) {
    const day = String(p.time ?? "").slice(0, 10);
    if (!day) continue;
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(p);
  }
  // sort theo time trong từng ngày
  for (const [k, arr] of map.entries()) {
    arr.sort((a, b) => String(a.time).localeCompare(String(b.time)));
    map.set(k, arr);
  }
  return map;
}

/** Lấy đúng 24 giờ: ưu tiên 0..23 nếu có; fallback: slice(0,24) */
export function pick24Hours<T extends { time: string }>(dayPoints: T[]) {
  const byHour = new Map<number, T>();
  for (const p of dayPoints ?? []) {
    const t = new Date(p.time).getTime();
    if (Number.isNaN(t)) continue;
    const h = new Date(p.time).getHours();
    if (!byHour.has(h)) byHour.set(h, p);
  }
  const out: T[] = [];
  for (let h = 0; h < 24; h++) {
    const v = byHour.get(h);
    if (v) out.push(v);
  }
  // nếu thiếu nhiều quá, fallback
  if (out.length < 16) return (dayPoints ?? []).slice(0, 24);
  return out;
}
