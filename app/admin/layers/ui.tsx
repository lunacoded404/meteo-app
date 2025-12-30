"use client";

import { useMemo, useState } from "react";
import type { MapLayer } from "./page";

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

const ICON_OPTIONS = ["Thermometer", "Wind", "Umbrella", "Droplet", "Cloudy", "Layers", "Map"] as const;

async function patchLayer(id: number, payload: Partial<MapLayer>) {
  const res = await fetch(`/api/admin/layers/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const detail = data?.detail ?? text ?? "";
    throw new Error(`${res.status} ${res.statusText}${detail ? ` - ${detail}` : ""}`);
  }

  return data as MapLayer;
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-white/50">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

export default function LayersClient({ initial }: { initial: MapLayer[] }) {
  const [rows, setRows] = useState<MapLayer[]>(initial);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const enabledCount = useMemo(() => rows.filter((r) => r.is_enabled).length, [rows]);
  const disabledCount = useMemo(() => rows.length - enabledCount, [rows]);

  async function onToggle(id: number) {
    setBusyId(id);
    setMsg(null);
    try {
      const cur = rows.find((r) => r.id === id);
      if (!cur) return;

      const next = await patchLayer(id, { is_enabled: !cur.is_enabled });
      setRows((p) => p.map((r) => (r.id === id ? next : r)));
      setMsg({ type: "ok", text: `Đã ${next.is_enabled ? "bật" : "tắt"}: ${next.key}` });
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Toggle failed" });
    } finally {
      setBusyId(null);
    }
  }

  async function onChangeIcon(id: number, icon: string) {
    setBusyId(id);
    setMsg(null);
    try {
      const next = await patchLayer(id, { icon });
      setRows((p) => p.map((r) => (r.id === id ? next : r)));
      setMsg({ type: "ok", text: `Đã đổi icon: ${next.key} → ${next.icon ?? icon}` });
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Update icon failed" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* alerts */}
      {msg && (
        <div
          className={cx(
            "rounded-xl border px-4 py-3 text-sm",
            msg.type === "ok" && "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
            msg.type === "err" && "border-rose-400/30 bg-rose-500/10 text-rose-100"
          )}
        >
          {msg.text}
        </div>
      )}

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatPill label="Total" value={`${rows.length}`} />
        <StatPill label="Enabled" value={`${enabledCount}`} />
        <StatPill label="Disabled" value={`${disabledCount}`} />
      </div>

      {/* DESKTOP/TABLE */}
      <div className="hidden sm:block">
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="text-sm font-medium">Danh sách layers</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="text-left px-4 py-3 w-[110px]">Status</th>
                  <th className="text-left px-4 py-3">Key</th>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3 w-[220px]">Icon</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onToggle(r.id)}
                        disabled={busyId === r.id}
                        className={cx(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                          r.is_enabled
                            ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                            : "border-white/15 bg-white/5 text-white/80",
                          busyId === r.id && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        <span
                          className={cx(
                            "h-2 w-2 rounded-full",
                            r.is_enabled ? "bg-emerald-400" : "bg-white/40"
                          )}
                        />
                        {busyId === r.id ? "Đang lưu..." : r.is_enabled ? "Enabled" : "Disabled"}
                      </button>
                    </td>

                    <td className="px-4 py-3 font-mono text-white/90">{r.key}</td>
                    <td className="px-4 py-3">{r.name}</td>

                    <td className="px-4 py-3">
                      <select
                        value={r.icon || "Thermometer"}
                        onChange={(e) => onChangeIcon(r.id, e.target.value)}
                        disabled={busyId === r.id}
                        className={cx(
                          "w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm",
                          busyId === r.id && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {ICON_OPTIONS.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}

                {!rows.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-white/50">
                      Chưa có layer nào trong DB (chạy seed theo danh sách /map).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MOBILE/CARDS */}
      <div className="sm:hidden space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{r.name}</div>
                <div className="text-xs text-white/60 font-mono truncate">{r.key}</div>
              </div>

              <button
                onClick={() => onToggle(r.id)}
                disabled={busyId === r.id}
                className={cx(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
                  r.is_enabled
                    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                    : "border-white/15 bg-white/5 text-white/80",
                  busyId === r.id && "opacity-60 cursor-not-allowed"
                )}
              >
                {busyId === r.id ? "..." : r.is_enabled ? "ON" : "OFF"}
              </button>
            </div>

            <div className="mt-3">
              <div className="text-[11px] text-white/60 mb-1">Icon</div>
              <select
                value={r.icon || "Thermometer"}
                onChange={(e) => onChangeIcon(r.id, e.target.value)}
                disabled={busyId === r.id}
                className={cx(
                  "w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm",
                  busyId === r.id && "opacity-60 cursor-not-allowed"
                )}
              >
                {ICON_OPTIONS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}

        {!rows.length && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/50">
            Chưa có layer nào trong DB (chạy seed theo danh sách /map).
          </div>
        )}
      </div>

      {/* footnote
      <div className="text-xs text-white/45">
        Mẹo: sau khi đổi trong admin, mở lại trang /map để thấy cập nhật (nếu bạn chưa bật auto-refresh).
      </div> */}
    </div>
  );
}
