"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BarChart3, Download, RefreshCw, TrendingUp } from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

type TopItem = {
  province_code: string;
  province_name: string;
  hits: number;
  map_hits: number;
  search_hits: number;
};

type CompareResp = {
  province_code?: string;
  ranges: {
    this_week: { start: string; end: string };
    last_week: { start: string; end: string };
  };
  summary: {
    this_week: Record<string, number | null>;
    last_week: Record<string, number | null>;
    delta: Record<string, number | null>;
  };
  series: {
    this_week: Record<string, any>;
    last_week: Record<string, any>;
  };
};

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

const selectCls =
  "h-10 w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm text-slate-900 " +
  "shadow-sm outline-none transition " +
  "focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-200";

const btnCls =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm " +
  "text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed";

async function readJsonSafe(res: Response): Promise<{ data: any; text: string }> {
  const text = await res.text().catch(() => "");
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { data, text };
}

function errFrom(res: Response, data: any, text: string) {
  const detail = data?.detail || data?.message || data?.error;
  if (detail) return String(detail);

  const t = (text || "").trim();
  if (t.startsWith("<!DOCTYPE") || t.startsWith("<html")) {
    return `Server returned HTML (likely 500/redirect). Preview: ${t.slice(0, 140)}...`;
  }

  if (t) return t.slice(0, 220);
  return `HTTP ${res.status}`;
}

async function fetchCompare(code: string): Promise<CompareResp> {
  const res = await adminFetch(`/api/admin/reports/compare-week/${code}`);
  const { data, text } = await readJsonSafe(res);

  if (!res.ok) throw new Error(errFrom(res, data, text));
  if (!data || typeof data !== "object") throw new Error(`Invalid JSON. Preview: ${(text || "").slice(0, 140)}...`);

  return data as CompareResp;
}

async function fetchTop(days: number, source: "all" | "map" | "search"): Promise<TopItem[]> {
  const res = await adminFetch(`/api/admin/analytics/top-provinces?days=${days}&source=${source}`);
  const { data, text } = await readJsonSafe(res);

  if (!res.ok) throw new Error(errFrom(res, data, text));
  const items = data?.items;
  if (!Array.isArray(items)) return [];
  return items as TopItem[];
}

function fmtNum(x: any, digits = 1) {
  if (x == null) return "—";
  const n = Number(x);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}
function fmtDelta(x: any, digits = 1) {
  if (x == null) return "—";
  const n = Number(x);
  if (!Number.isFinite(n)) return "—";
  const s = n > 0 ? "+" : "";
  return `${s}${n.toFixed(digits)}`;
}
function shortDateLabel(iso?: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}`;
}
function getDailyArray(daily: Record<string, any>, key: string): Array<number | null> {
  const arr = daily?.[key];
  if (!Array.isArray(arr)) return [];
  return arr.map((v) => {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  });
}

/** ✅ metric types (FIX TS) */
type ChartMetricKey = "tmax" | "tmin" | "rain" | "wind" | "cloud";
type MetricConf = { label: string; field: string; unit: string; digits: number; kind: "line" | "bar" };

const METRICS: Record<ChartMetricKey, MetricConf> = {
  tmax: { label: "Nhiệt độ max (°C)", field: "temperature_2m_max", unit: "°C", digits: 1, kind: "line" },
  tmin: { label: "Nhiệt độ min (°C)", field: "temperature_2m_min", unit: "°C", digits: 1, kind: "line" },
  rain: { label: "Lượng mưa (mm)", field: "precipitation_sum", unit: "mm", digits: 1, kind: "bar" },
  wind: { label: "Gió max (km/h)", field: "wind_speed_10m_max", unit: "km/h", digits: 1, kind: "line" },
  cloud: { label: "Mây TB (%)", field: "cloud_cover", unit: "%", digits: 0, kind: "line" },
};

function buildCompareChartOption(compare: CompareResp, metric: MetricConf) {
  const thisDaily = (compare?.series?.this_week || {}) as Record<string, any>;
  const lastDaily = (compare?.series?.last_week || {}) as Record<string, any>;

  const thisTime: string[] = Array.isArray(thisDaily.time) ? thisDaily.time : [];
  const lastTime: string[] = Array.isArray(lastDaily.time) ? lastDaily.time : [];

  const aAll = getDailyArray(thisDaily, metric.field);
  const bAll = getDailyArray(lastDaily, metric.field);

  const n = Math.max(0, Math.min(aAll.length || thisTime.length || 0, bAll.length || lastTime.length || 0));
  const x = Array.from({ length: n }, (_, i) => `D${i + 1}`);

  const thisArr = aAll.slice(0, n);
  const lastArr = bAll.slice(0, n);

  const thisDates = thisTime.slice(0, n).map(shortDateLabel);
  const lastDates = lastTime.slice(0, n).map(shortDateLabel);

  return {
    grid: { left: 48, right: 16, top: 34, bottom: 36 },
    tooltip: {
      trigger: "axis",
      confine: true,
      formatter: (items: any[]) => {
        if (!Array.isArray(items) || !items.length) return "";
        const idx = items?.[0]?.dataIndex ?? 0;
        const dThis = thisDates[idx] ? ` (${thisDates[idx]})` : "";
        const dLast = lastDates[idx] ? ` (${lastDates[idx]})` : "";

        const a = items.find((x) => String(x.seriesName || "").includes("Tuần này"));
        const b = items.find((x) => String(x.seriesName || "").includes("Tuần trước"));

        const av = a?.data ?? null;
        const bv = b?.data ?? null;

        return [
          `<b>${items[0].axisValue}</b>`,
          `Tuần này${dThis}: <b>${av == null ? "—" : fmtNum(av, metric.digits)} ${metric.unit}</b>`,
          `Tuần trước${dLast}: <b>${bv == null ? "—" : fmtNum(bv, metric.digits)} ${metric.unit}</b>`,
        ].join("<br/>");
      },
    },
    xAxis: { type: "category", data: x, axisLabel: { fontSize: 11 } },
    yAxis: { type: "value", axisLabel: { fontSize: 11 }, splitLine: { lineStyle: { type: "dashed" } } },
    legend: { top: 6, left: 8, textStyle: { fontSize: 11 } },
    series: [
      { name: "Tuần này", type: metric.kind, smooth: metric.kind === "line", data: thisArr },
      { name: "Tuần trước", type: metric.kind, smooth: metric.kind === "line", data: lastArr },
    ],
  };
}

function StatPill({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "good" | "bad";
}) {
  const toneCls =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "bad"
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : "border-slate-200 bg-slate-50 text-slate-900";

  return (
    <div className={cx("rounded-2xl border px-3 py-2", toneCls)}>
      <div className="text-[11px] opacity-70">{label}</div>
      <div className="text-[16px] font-semibold leading-tight tabular-nums">{value}</div>
      {sub ? <div className="text-[11px] opacity-70">{sub}</div> : null}
    </div>
  );
}

function buildTopChartOption(items: TopItem[], pickCode: string) {
  const top10 = (items || []).slice(0, 10);
  const names = top10.map((x) => (x.province_name || x.province_code || "").slice(0, 18));
  const vals = top10.map((x) => Number(x.hits || 0));

  return {
    grid: { left: 8, right: 10, top: 12, bottom: 6, containLabel: true },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true },
    xAxis: { type: "value", axisLabel: { fontSize: 11 }, splitLine: { lineStyle: { type: "dashed" } } },
    yAxis: {
      type: "category",
      data: names,
      axisLabel: { fontSize: 11, width: 120, overflow: "truncate" },
    },
    series: [
      {
        name: "Hits",
        type: "bar",
        data: top10.map((x) => ({
          value: Number(x.hits || 0),
          // highlight selected row nhẹ nhàng bằng opacity qua itemStyle
          itemStyle: { opacity: pickCode && x.province_code === pickCode ? 1 : 0.65 },
        })),
        barMaxWidth: 18,
        emphasis: { focus: "series" },
      },
    ],
  };
}

export default function ReportsClient() {
  const [days, setDays] = useState<7 | 30>(7);
  const [source, setSource] = useState<"all" | "map" | "search">("all");

  const [top, setTop] = useState<TopItem[]>([]);
  const [loadingTop, setLoadingTop] = useState(false);
  const [errTop, setErrTop] = useState<string | null>(null);

  const [pickCode, setPickCode] = useState<string>("");
  const [compare, setCompare] = useState<CompareResp | null>(null);
  const [loadingCmp, setLoadingCmp] = useState(false);
  const [errCmp, setErrCmp] = useState<string | null>(null);

  const [metricKey, setMetricKey] = useState<ChartMetricKey>("tmax");

  const loadTop = async () => {
    setLoadingTop(true);
    setErrTop(null);
    try {
      const items = await fetchTop(days, source);
      setTop(items);
      setPickCode((prev) => (prev ? prev : String(items?.[0]?.province_code || "")));
    } catch (e: any) {
      setErrTop(e?.message || "Error");
      setTop([]);
    } finally {
      setLoadingTop(false);
    }
  };

  useEffect(() => {
    loadTop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, source]);

  useEffect(() => {
    if (!pickCode || pickCode === "undefined") return;

    (async () => {
      setLoadingCmp(true);
      setErrCmp(null);
      try {
        const r = await fetchCompare(pickCode);
        setCompare(r);
      } catch (e: any) {
        setErrCmp(e?.message || "Error");
        setCompare(null);
      } finally {
        setLoadingCmp(false);
      }
    })();
  }, [pickCode]);

  const pickedName = useMemo(
    () => top.find((x) => x.province_code === pickCode)?.province_name,
    [top, pickCode]
  );

  const metricConf = METRICS[metricKey];

  const chartOption = useMemo(() => {
    if (!compare) return null;
    return buildCompareChartOption(compare, metricConf);
  }, [compare, metricConf]);

  const topChartOption = useMemo(() => {
    if (!top?.length) return null;
    return buildTopChartOption(top, pickCode);
  }, [top, pickCode]);

  const thisS = compare?.summary?.this_week || {};
  const deltaT = compare?.summary?.delta || {};

  const toneOf = (x: any) => {
    if (x == null) return "neutral";
    const n = Number(x);
    if (!Number.isFinite(n)) return "neutral";
    return n > 0 ? "good" : n < 0 ? "bad" : "neutral";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-3 sm:px-6 lg:px-8">
      {/* ===== Header / Filters ===== */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-700" />
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900">Báo cáo truy cập</h1>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Xem top tỉnh/thành theo nguồn truy cập và so sánh dữ liệu tuần này với tuần trước.
            </p>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={loadTop} className={btnCls}>
              <RefreshCw className={cx("h-4 w-4", loadingTop && "animate-spin")} />
              Làm mới
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <div className="text-[12px] font-medium text-slate-700">Khoảng thời gian</div>
            <select className={selectCls} value={days} onChange={(e) => setDays(Number(e.target.value) as any)}>
              <option value={7}>7 ngày</option>
              <option value={30}>30 ngày</option>
            </select>
          </label>

          <label className="space-y-1">
            <div className="text-[12px] font-medium text-slate-700">Nguồn</div>
            <select className={selectCls} value={source} onChange={(e) => setSource(e.target.value as any)}>
              <option value="all">Tất cả nguồn</option>
              <option value="map">Bản đồ</option>
              <option value="search">Tìm kiếm</option>
            </select>
          </label>

          <label className="space-y-1">
            <div className="text-[12px] font-medium text-slate-700">Metric so sánh</div>
            <select className={selectCls} value={metricKey} onChange={(e) => setMetricKey(e.target.value as any)}>
              <option value="tmax">Nhiệt độ max (°C)</option>
              <option value="tmin">Nhiệt độ min (°C)</option>
              <option value="rain">Lượng mưa (mm)</option>
              <option value="wind">Gió max (km/h)</option>
              <option value="cloud">Mây TB (%)</option>
            </select>
          </label>

          <div className="space-y-1">
            <div className="text-[12px] font-medium text-slate-700">Xuất dữ liệu</div>
            <button
              type="button"
              disabled={!pickCode}
              onClick={() => window.open(`/api/admin/reports/compare-week/${pickCode}?download=csv`, "_blank")}
              className={cx(btnCls, "w-full")}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* ===== Main grid ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-4 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900">Top tỉnh/thành</div>
                <div className="text-[12px] text-slate-500">{days} ngày</div>
              </div>

              {errTop && (
                <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {errTop}
                </div>
              )}

              {/* Top chart */}
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center gap-2 text-sm text-slate-700">
                  <BarChart3 className="h-4 w-4" />
                  <div className="font-medium">Top 10 (Tổng số lượt truy cập)</div>
                </div>
                {topChartOption ? (
                  <div className="h-[260px]">
                    <ReactECharts option={topChartOption} style={{ height: "100%", width: "100%" }} />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    Chưa có dữ liệu biểu đồ.
                  </div>
                )}
              </div>

              {/* Table/list */}
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                <div className="hidden sm:grid grid-cols-12 gap-0 bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
                  <div className="col-span-6">Tỉnh</div>
                  <div className="col-span-2 text-right">Total</div>
                  <div className="col-span-2 text-right">Map</div>
                  <div className="col-span-2 text-right">Search</div>
                </div>

                <div className="max-h-[520px] overflow-auto">
                  {loadingTop && (
                    <div className="px-3 py-3 text-sm text-slate-600">Đang tải top tỉnh/thành...</div>
                  )}

                  {top.map((it) => {
                    const active = it.province_code === pickCode;

                    return (
                      <button
                        key={it.province_code}
                        type="button"
                        onClick={() => setPickCode(it.province_code)}
                        className={cx(
                          "w-full border-t border-slate-200 text-left hover:bg-slate-50 transition",
                          active && "bg-slate-100"
                        )}
                      >
                        {/* ✅ Desktop: 1 hàng = grid-cols-12 giống header => cột thẳng hàng */}
                        <div className="hidden sm:grid grid-cols-12 items-center gap-0 px-3 py-2 text-sm">
                          <div className="col-span-6 min-w-0">
                            <div className="font-medium text-slate-900 truncate">
                              {it.province_name || it.province_code}
                              <span className="ml-2 text-[11px] text-slate-500">({it.province_code})</span>
                            </div>
                          </div>

                          <div className="col-span-2 text-right tabular-nums font-semibold text-slate-900">
                            {it.hits}
                          </div>
                          <div className="col-span-2 text-right tabular-nums text-slate-700">
                            {it.map_hits}
                          </div>
                          <div className="col-span-2 text-right tabular-nums text-slate-700">
                            {it.search_hits}
                          </div>
                        </div>

                        {/* ✅ Mobile: card stats như bạn đang làm */}
                        <div className="sm:hidden px-3 py-3">
                          <div className="font-medium text-slate-900 truncate">
                            {it.province_name || it.province_code}
                            <span className="ml-2 text-[11px] text-slate-500">({it.province_code})</span>
                          </div>

                          <div className="mt-2 grid grid-cols-3 gap-2 text-[12px] text-slate-700">
                            <div className="rounded-lg bg-white border border-slate-200 px-2 py-1">
                              <div className="text-[10px] text-slate-500">Total</div>
                              <div className="font-semibold tabular-nums">{it.hits}</div>
                            </div>
                            <div className="rounded-lg bg-white border border-slate-200 px-2 py-1">
                              <div className="text-[10px] text-slate-500">Map</div>
                              <div className="font-semibold tabular-nums">{it.map_hits}</div>
                            </div>
                            <div className="rounded-lg bg-white border border-slate-200 px-2 py-1">
                              <div className="text-[10px] text-slate-500">Search</div>
                              <div className="font-semibold tabular-nums">{it.search_hits}</div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {!loadingTop && top.length === 0 && (
                    <div className="px-3 py-3 text-sm text-slate-600">Chưa có dữ liệu truy cập.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right */}
        <section className="lg:col-span-7">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="font-semibold text-slate-900">So sánh tuần</div>
                <div className="mt-1 text-sm text-slate-600 truncate">
                  {pickCode ? (
                    <>
                      Đang xem: <span className="font-medium text-slate-900">{pickedName || pickCode}</span>
                    </>
                  ) : (
                    "Chọn một tỉnh ở bên trái."
                  )}
                </div>
              </div>
            </div>

            {loadingCmp && (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                Đang tải so sánh...
              </div>
            )}
            {errCmp && (
              <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {errCmp}
              </div>
            )}

            {compare && (
              <>
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-700">
                  Tuần này: {compare.ranges.this_week.start} → {compare.ranges.this_week.end}
                  <div>
                    Tuần trước: {compare.ranges.last_week.start} → {compare.ranges.last_week.end}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatPill
                    label="Tmax TB (°C)"
                    value={fmtNum(thisS.tmax_avg, 1)}
                    sub={`Δ ${fmtDelta(deltaT.tmax_avg, 1)}`}
                    tone={toneOf(deltaT.tmax_avg) as any}
                  />
                  <StatPill
                    label="Tmin TB (°C)"
                    value={fmtNum(thisS.tmin_avg, 1)}
                    sub={`Δ ${fmtDelta(deltaT.tmin_avg, 1)}`}
                    tone={toneOf(deltaT.tmin_avg) as any}
                  />
                  <StatPill
                    label="Tổng mưa (mm)"
                    value={fmtNum(thisS.rain_sum, 1)}
                    sub={`Δ ${fmtDelta(deltaT.rain_sum, 1)}`}
                    tone="neutral"
                  />
                  <StatPill
                    label="Gió max TB"
                    value={fmtNum(thisS.wind_max_avg, 1)}
                    sub={`Δ ${fmtDelta(deltaT.wind_max_avg, 1)}`}
                    tone="neutral"
                  />
                </div>

                <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-3 sm:p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm text-slate-700">
                    <TrendingUp className="h-4 w-4" />
                    <div className="font-medium">
                      Biểu đồ so sánh: <span className="text-slate-900">{metricConf.label}</span>
                    </div>
                  </div>

                  {chartOption ? (
                    <div className="h-[320px] sm:h-[380px]">
                      <ReactECharts option={chartOption} style={{ height: "100%", width: "100%" }} />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                      Chưa có dữ liệu biểu đồ.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
