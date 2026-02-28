"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";
import type { DailyRow } from "../daily7.types";
import { numCell, round1 } from "../daily7.utils";
import { SectionCard, TableShell, Th, Td } from "../daily7.ui";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

export default function TemperaturePanel({ rows }: { rows: DailyRow[] }) {
  const [open, setOpen] = useState(false);
  const x = rows.map((d) => d.label);

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        valueFormatter: (val: any) => {
          if (val == null || val === "—" || Number.isNaN(Number(val))) return "—";
          return `${Math.round(Number(val))}°C`;
        },
      },
      legend: {
        data: ["Cao nhất (°C)", "Thấp nhất (°C)"],
        bottom: 6,
        left: "center",
        textStyle: { color: "#cbd5e1" },
      },
      grid: { left: 48, right: 16, top: 42, bottom: 54 },
      xAxis: { type: "category", data: x, axisLabel: { color: "#cbd5e1" } },
      yAxis: { type: "value", axisLabel: { formatter: "{value} °C", color: "#cbd5e1" } },
      series: [
        {
          name: "Cao nhất (°C)",
          type: "line",
          smooth: true,
          data: rows.map((d) => d.tmax),
          lineStyle: { color: "#ef4444", width: 2 },
          itemStyle: { color: "#ef4444" },
          tooltip: { valueFormatter: (v: any) => (v == null ? "—" : `${Math.round(Number(v))}°C`) },
        },
        {
          name: "Thấp nhất (°C)",
          type: "line",
          smooth: true,
          data: rows.map((d) => d.tmin),
          lineStyle: { color: "#3b82f6", width: 2 },
          itemStyle: { color: "#3b82f6" },
          tooltip: { valueFormatter: (v: any) => (v == null ? "—" : `${Math.round(Number(v))}°C`) },
        },
      ],
    }),
    [rows, x]
  );

  return (
    <SectionCard id="temp" title="Nhiệt độ (°C)" subtitle="Cao nhất/Thấp nhất theo ngày">
      <ReactECharts option={option} style={{ height: 300, width: "100%" }} notMerge lazyUpdate />
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-slate-100 hover:bg-white/10 transition"
          aria-expanded={open}
          title="Xem/ẩn bảng chi tiết"
        >
          <Menu className="h-4 w-4" />
          {open ? "Ẩn chi tiết" : `Chi tiết ${rows.length} ngày`}
        </button>
      </div>

      {open ? (
        <TableShell title="Bảng chi tiết nhiệt độ">
          <table className="min-w-[640px] w-full">
            <thead className="bg-white/5">
              <tr>
                <Th>Ngày</Th>
                <Th>Nhiệt độ cao nhất (°C)</Th>
                <Th>Nhiệt độ thấp nhất (°C)</Th>
                <Th>Biên độ (°C)</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const amp = d.tmax != null && d.tmin != null ? round1(d.tmax - d.tmin) : null;
                return (
                  <tr key={d.date} className="border-t border-white/10">
                    <Td>{d.label}</Td>
                    <Td>{numCell(d.tmax, "°C")}</Td>
                    <Td>{numCell(d.tmin, "°C")}</Td>
                    <Td>{numCell(amp, "°C")}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      ) : null}
    </SectionCard>
  );
}
