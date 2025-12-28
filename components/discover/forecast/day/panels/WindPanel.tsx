"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";
import type { DailyRow } from "../daily7.types";
import { numCell } from "../daily7.utils";
import { SectionCard, TableShell, Th, Td } from "../daily7.ui";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

function degToLabel(deg?: number | null) {
  if (deg == null || Number.isNaN(deg)) return "—";
  const d = ((deg % 360) + 360) % 360;
  const dirs = ["Bắc", "ĐB", "Đông", "ĐN", "Nam", "TN", "Tây", "TB"];
  const idx = Math.round(d / 45) % 8;
  return `${dirs[idx]} (${Math.round(d)}°)`;
}

export default function WindPanel({ rows }: { rows: DailyRow[] }) {
  const [open, setOpen] = useState(false);
  const x = rows.map((d) => d.label);

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        valueFormatter: (val: any) => {
          if (val == null || val === "—" || Number.isNaN(Number(val))) return "—";
          return `${Math.round(Number(val))}`;
        },
      },
      legend: {
        data: ["Gió lớn nhất (km/h)", "Hướng gió (°)"],
        bottom: 8,
        left: "center",
        orient: "horizontal",
        textStyle: { color: "#cbd5e1" },
        itemGap: 18,
      },
      grid: { left: 52, right: 52, top: 24, bottom: 64 },
      xAxis: { type: "category", data: x, axisLabel: { color: "#cbd5e1" } },
      yAxis: [
        {
          type: "value",
          name: "km/h",
          axisLabel: { formatter: "{value}", color: "#cbd5e1" },
          splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        },
        {
          type: "value",
          name: "°",
          min: 0,
          max: 360,
          interval: 90,
          axisLabel: { formatter: "{value}°", color: "#cbd5e1" },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "Gió lớn nhất (km/h)",
          type: "bar",
          data: rows.map((d) => d.wind),
          barMaxWidth: 26,
          tooltip: { valueFormatter: (v: any) => (v == null ? "—" : `${v} km/h`) },
        },
        {
          name: "Hướng gió (°)",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          data: rows.map((d) => d.windDir),
          tooltip: { valueFormatter: (v: any) => (v == null ? "—" : `${Math.round(Number(v))}°`) },
        },
      ],
    }),
    [rows, x]
  );

  return (
    <SectionCard id="wind" title="Tốc độ gió (km/h) và hướng gió chủ đạo (°)" subtitle="Lớn nhất trong ngày">
      <ReactECharts option={option} style={{ height: 300, width: "100%" }} notMerge lazyUpdate />

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-slate-100 hover:bg-white/10 transition"
          aria-expanded={open}
        >
          <Menu className="h-4 w-4" />
          {open ? "Ẩn chi tiết" : `Chi tiết ${rows.length} ngày`}
        </button>
      </div>

      {open ? (
        <TableShell title="Bảng chi tiết gió">
          <table className="min-w-[760px] w-full">
            <thead className="bg-white/5">
              <tr>
                <Th>Ngày</Th>
                <Th>Tốc độ gió lớn nhất (km/h)</Th>
                <Th>Hướng gió (tại tốc độ gió lớn nhất)</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.date} className="border-t border-white/10">
                  <Td>{d.label}</Td>
                  <Td>{numCell(d.wind, "km/h")}</Td>
                  <Td>{degToLabel(d.windDir)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      ) : null}
    </SectionCard>
  );
}
