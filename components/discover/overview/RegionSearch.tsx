"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export type ProvinceIndexItem = {
  code: string;
  name: string;
  centroid?: { lat: number; lon: number };
};

export type RegionEventDetail = {
  code: string;
  name: string;
  lat: number;
  lon: number;
};

declare global {
  interface WindowEventMap {
    "meteo:region": CustomEvent<RegionEventDetail>;
  }
}

const STORAGE_KEY = "meteo:lastRegion";

const DEFAULT_HCM: ProvinceIndexItem = {
  code: "79",
  name: "TP.Hồ Chí Minh",
  centroid: { lat: 10.8231, lon: 106.6297 },
};

export function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export function normalizeVN(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function pickDefaultHCM(items: ProvinceIndexItem[]) {
  const candidates = [
    "tp. ho chi minh",
    "tp ho chi minh",
    "thanh pho ho chi minh",
    "ho chi minh",
    "hcm",
  ];

  const found =
    items.find((it) => candidates.includes(normalizeVN(it.name))) ||
    items.find((it) => normalizeVN(it.name).includes("ho chi minh")) ||
    null;

  if (found?.centroid) return found;
  return DEFAULT_HCM;
}

function emitRegion(it: ProvinceIndexItem) {
  if (!it?.centroid) return;

  const detail: RegionEventDetail = {
    code: it.code,
    name: it.name,
    lat: it.centroid.lat,
    lon: it.centroid.lon,
  };

  window.dispatchEvent(new CustomEvent("meteo:region", { detail }));

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(detail));
  } catch {}
}

export default function RegionSearch({
  apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000",
  placeholder = "Tìm tỉnh/thành…",
  value,
  onChange,
}: {
  apiBase?: string;
  placeholder?: string;
  value: ProvinceIndexItem | null;
  onChange: (item: ProvinceIndexItem) => void;
}) {
  const [items, setItems] = useState<ProvinceIndexItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const j = JSON.parse(raw);
      if (
        typeof j?.code === "string" &&
        typeof j?.name === "string" &&
        typeof j?.lat === "number" &&
        typeof j?.lon === "number"
      ) {
        const saved: ProvinceIndexItem = {
          code: j.code,
          name: j.name,
          centroid: { lat: j.lat, lon: j.lon },
        };
        onChange(saved);
        setQ(saved.name);

        window.dispatchEvent(
          new CustomEvent("meteo:region", {
            detail: { code: j.code, name: j.name, lat: j.lat, lon: j.lon },
          })
        );
      }
    } catch {}
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const url = new URL("/api/provinces/", apiBase).toString();
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);

        const fc = await res.json();
        const feats: any[] = Array.isArray(fc?.features) ? fc.features : [];

        const list: ProvinceIndexItem[] = feats
          .map((f) => {
            const code = String(f?.properties?.code ?? "");
            const name = String(f?.properties?.name ?? "");

            const latRaw = f?.properties?.centroid_lat ?? f?.properties?.lat ?? null;
            const lonRaw = f?.properties?.centroid_lon ?? f?.properties?.lon ?? null;

            const lat = latRaw == null ? null : Number(latRaw);
            const lon = lonRaw == null ? null : Number(lonRaw);

            return {
              code,
              name,
              centroid:
                Number.isFinite(lat) && Number.isFinite(lon)
                  ? { lat: lat as number, lon: lon as number }
                  : undefined,
            };
          })
          .filter((x) => x.code && x.name)
          .sort((a, b) => a.name.localeCompare(b.name));

        if (!alive) return;
        setItems(list);
      } catch (e) {
        console.error("Load provinces index failed:", e);
        if (!alive) return;
        setItems([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [apiBase]);

  useEffect(() => {
    if (value?.code) return;
    const def = items.length ? pickDefaultHCM(items) : DEFAULT_HCM;

    onChange(def);
    setQ(def.name);
    emitRegion(def);

  }, [items, value?.code]);

  useEffect(() => {
    if (value?.name) setQ(value.name);
  }, [value?.name]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filtered = useMemo(() => {
    const nq = normalizeVN(q);
    if (!nq) return items.slice(0, 12);

    const scored = items
      .map((it) => {
        const n = normalizeVN(it.name);
        const idx = n.indexOf(nq);
        const score = idx === 0 ? 1000 - n.length : idx > 0 ? 500 - idx : -9999;
        return { it, score };
      })
      .filter((x) => x.score > -9999)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((x) => x.it);

    return scored;
  }, [items, q]);

  useEffect(() => {
    setActiveIdx(0);
  }, [q]);

  const commitPick = (it: ProvinceIndexItem) => {
    if (!it.centroid) return;

    onChange(it);
    setQ(it.name);
    setOpen(false);
    emitRegion(it);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((v) => Math.min(v + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((v) => Math.max(v - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[activeIdx];
      if (it) commitPick(it);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showHint = loading ? "Đang tải danh sách tỉnh..." : placeholder;

  return (
    <div ref={rootRef} className="relative">
      <div
        className={cx(
          "flex items-center gap-2",
          "rounded-2xl bg-white/8 border border-white/10",
          "px-3 py-2"
        )}
      >
        <Search className="h-4 w-4 text-white/70 shrink-0" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={showHint}
          className={cx(
            "w-full bg-transparent outline-none",
            "text-[14px] text-white placeholder:text-white/45"
          )}
        />

        {q ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setOpen(true);
              inputRef.current?.focus();
            }}
            className="grid place-items-center h-8 w-8 rounded-full bg-white/10 hover:bg-white/15 transition-colors"
            aria-label="Clear"
            title="Xóa"
          >
            <X className="h-4 w-4 text-white/80" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          className={cx(
            "absolute z-50 mt-2 w-full",
            "rounded-2xl bg-[#0b0614]/95 backdrop-blur-xl",
            "border border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.45)]",
            "overflow-hidden"
          )}
          role="listbox"
          aria-label="Provinces"
        >
          {loading ? (
            <div className="px-3 py-3 text-[12px] text-white/70">Đang tải…</div>
          ) : filtered.length ? (
            <div className="max-h-[320px] overflow-auto py-1">
              {filtered.map((it, idx) => {
                const active = idx === activeIdx;
                const selected = value?.code === it.code;
                const disabled = !it.centroid;

                return (
                  <button
                    key={it.code}
                    type="button"
                    disabled={disabled}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => commitPick(it)}
                    className={cx(
                      "w-full text-left px-3 py-2",
                      "flex items-center justify-between gap-3",
                      "transition-colors",
                      active ? "bg-white/10" : "bg-transparent",
                      "hover:bg-white/10",
                      disabled && "opacity-60 cursor-not-allowed"
                    )}
                    role="option"
                    aria-selected={selected}
                  >
                    <span className="text-[13px] text-white/90 truncate">{it.name}</span>

                    <div className="flex items-center gap-2 shrink-0">
                      {disabled ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-200/80">
                          Thiếu tọa độ
                        </span>
                      ) : null}

                      {selected ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/70">
                          Đang chọn
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-3 text-[12px] text-white/70">Không tìm thấy kết quả.</div>
          )}

          <div className="px-3 py-2 border-t border-white/10 text-[11px] text-white/55">
            Gõ tên • ↑↓ chọn • Enter để chọn • Esc để đóng
          </div>
        </div>
      ) : null}
    </div>
  );
}
