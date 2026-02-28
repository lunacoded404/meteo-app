"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export type ProvinceIndexItem = {
  code: string;
  name: string;
};

function normalizeVN(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type ProvinceSearchBarProps = {
  items: ProvinceIndexItem[];
  onSelect: (item: ProvinceIndexItem) => void;
  placeholder?: string;
};

export default function ProvinceSearchBar({
  items,
  onSelect,
  placeholder = "Tìm tỉnh/thành...",
}: ProvinceSearchBarProps) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo((): ProvinceIndexItem[] => {
    const nq = normalizeVN(q);
    if (!nq) return items.slice(0, 10);

    const scored = items
      .map((it) => {
        const nn = normalizeVN(it.name);
        let score = 9999;
        if (nn === nq) score = 0;
        else if (nn.startsWith(nq)) score = 1;
        else if (nn.includes(nq)) score = 2;
        return { it, score };
      })
      .filter((x) => x.score !== 9999)
      .sort((a, b) => a.score - b.score || a.it.name.localeCompare(b.it.name));

    return scored.slice(0, 12).map((x) => x.it);
  }, [q, items]);

  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  useEffect(() => {
    setActiveIdx(0);
  }, [q]);

  const choose = (it: ProvinceIndexItem) => {
    setQ(it.name);
    setOpen(false);
    onSelect(it);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((v) => Math.min(v + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((v) => Math.max(v - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[activeIdx];
      if (it) choose(it);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="w-[280px] max-w-[70vw]">
      <div className="rounded-2xl bg-slate-900/80 text-slate-100 backdrop-blur shadow-lg border border-slate-700/60 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <Search className="h-4 w-4 text-slate-200 shrink-0" />

          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-300"
          />

          {q.trim() ? (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setOpen(true);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg hover:bg-slate-800/70"
              aria-label="Xoá"
              title="Xoá"
            >
              <X className="h-4 w-4 text-slate-200" />
            </button>
          ) : null}
        </div>

        {open && filtered.length > 0 && (
          <div className="border-t border-slate-700/60 max-h-[260px] overflow-auto">
            {filtered.map((it, idx) => (
              <button
                key={it.code}
                type="button"
                onClick={() => choose(it)}
                onMouseEnter={() => setActiveIdx(idx)}
                className={[
                  "w-full text-left px-3 py-2 text-sm transition",
                  idx === activeIdx ? "bg-slate-800/70" : "bg-transparent hover:bg-slate-800/40",
                ].join(" ")}
              >
                <div className="font-medium text-slate-100">{it.name}</div>
                <div className="text-[11px] text-slate-300">Mã: {it.code}</div>
              </button>
            ))}
          </div>
        )}

        {open && filtered.length === 0 && (
          <div className="border-t border-slate-700/60 px-3 py-2 text-sm text-slate-300">
            Không tìm thấy tỉnh phù hợp.
          </div>
        )}
      </div>
    </div>
  );
}
