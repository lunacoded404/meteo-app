export function fmtDDMM(dateISO: string) {
  const d = new Date(dateISO + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateISO;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

export function n(v: any) {
  return v == null || Number.isNaN(Number(v)) ? null : Number(v);
}

export function round1(v: any) {
  const x = n(v);
  if (x == null) return null;
  return Math.round(x * 10) / 10;
}

export function numCell(v: any, suffix?: string) {
  if (v == null) return "—";
  return `${v}${suffix ?? ""}`;
}
