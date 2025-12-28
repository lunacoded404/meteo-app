"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";
import type { DailyRow } from "../daily7.types";
import { numCell } from "../daily7.utils";
import { SectionCard, TableShell, Th, Td } from "../daily7.ui";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

export default function HumidityPanel({ rows }: { rows: DailyRow[] }) {
  const [open, setOpen] = useState(false);
  const x = rows.map((d) => d.label);

  const LEGEND_LABEL = "Độ ẩm tương đối trung bình (%)";

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        valueFormatter: (val: any) => {
          if (val == null || val === "—" || Number.isNaN(Number(val))) return "—";
          return `${Math.round(Number(val))}%`;
        },
      },
      legend: { data: [LEGEND_LABEL], bottom: 8, left: "center", textStyle: { color: "#cbd5e1" } },
      grid: { left: 48, right: 16, top: 18, bottom: 64 },
      xAxis: { type: "category", data: x, axisLabel: { color: "#cbd5e1" } },
      yAxis: { type: "value", min: 0, max: 100, axisLabel: { formatter: "{value} %", color: "#cbd5e1" } },
      series: [{ name: LEGEND_LABEL, type: "line", smooth: true, areaStyle: {}, data: rows.map((d) => d.hum) }],
    }),
    [rows, x]
  );

  return (
    <SectionCard id="humidity" title="Độ ẩm tương đối trung bình (%)" subtitle="Trung bình theo ngày">
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
        <TableShell title="Bảng chi tiết độ ẩm (TB ngày)">
          <table className="min-w-[520px] w-full">
            <thead className="bg-white/5">
              <tr>
                <Th>Ngày</Th>
                <Th>Độ ẩm (%)</Th>
                <Th>Mức</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const lvl =
                  d.hum == null ? "—" : d.hum >= 85 ? "Rất ẩm" : d.hum >= 70 ? "Ẩm" : d.hum >= 55 ? "Vừa" : "Khô";
                return (
                  <tr key={d.date} className="border-t border-white/10">
                    <Td>{d.label}</Td>
                    <Td>{numCell(d.hum, "%")}</Td>
                    <Td>{lvl}</Td>
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
