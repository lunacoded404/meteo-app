'use client';
export const formatTimeVN = (iso?: string | null) => {
  if (!iso) return "Không rõ thời gian";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  return `${hh}:${mm} • ${dd}/${mo}`;
};

export const fmt = (v: number | null | undefined, digits = 1) => {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toFixed(digits);
};

export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export const windDirLabelVN = (deg?: number | null) => {
  if (deg == null || Number.isNaN(deg)) return "Không rõ hướng";
  const labels = ["Bắc", "ĐB", "Đông", "ĐN", "Nam", "TN", "Tây", "TB"];
  const idx = Math.round(((deg % 360) / 45)) % 8;
  return `${labels[idx]} (${Math.round(deg)}°)`;
};
