"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";
import type { DailyRow } from "../daily7.types";
import { numCell } from "../daily7.utils";
import { SectionCard, TableShell, Th, Td } from "../daily7.ui";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

export default function RainPanel({ rows }: { rows: DailyRow[] }) {
  const [open, setOpen] = useState(false);
  const x = rows.map((d) => d.label);

  const option = useMemo(
    () => ({
      tooltip: { trigger: "axis" },
      legend: {
        data: ["Mưa tích lũy (mm)", "Xác suất mưa (%)"],
        bottom: 8,
        left: "center",
        textStyle: { color: "#cbd5e1" },
        itemGap: 18,
      },
      grid: { left: 52, right: 52, top: 28, bottom: 64 },
      xAxis: { type: "category", data: x, axisLabel: { color: "#cbd5e1" } },
      yAxis: [
        { type: "value", axisLabel: { formatter: "{value} mm", color: "#cbd5e1" } },
        { type: "value", min: 0, max: 100, axisLabel: { formatter: "{value} %", color: "#cbd5e1" } },
      ],
      series: [
        {
          name: "Mưa tích lũy (mm)",
          type: "bar",
          data: rows.map((d) => d.rain),
          barMaxWidth: 26,
          tooltip: { valueFormatter: (v: any) => (v == null || Number.isNaN(Number(v)) ? "—" : `${Number(v)} mm`) },
        },
        {
          name: "Xác suất mưa (%)",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          data: rows.map((d) => d.rainProb),
          tooltip: { valueFormatter: (v: any) => (v == null || Number.isNaN(Number(v)) ? "—" : `${Math.round(Number(v))}%`) },
        },
      ],
    }),
    [rows, x]
  );

  return (
    <SectionCard id="rain" title="Lượng mưa tích lũy (mm) + Xác suất mưa(%)" subtitle="Theo ngày">
      <ReactECharts option={option} style={{ height: 320, width: "100%" }} notMerge lazyUpdate />

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
        <TableShell title="Bảng chi tiết lượng mưa tích lũy và xác suất mưa">
          <table className="min-w-[720px] w-full">
            <thead className="bg-white/5">
              <tr>
                <Th>Ngày</Th>
                <Th>Lượng mưa tích lũy (mm)</Th>
                <Th>Xác suất max (%)</Th>
                <Th>Mức độ</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const level =
                  d.rain == null
                    ? "—"
                    : d.rain >= 30
                    ? "Mưa rất to"
                    : d.rain >= 15
                    ? "Mưa to"
                    : d.rain >= 5
                    ? "Mưa vừa"
                    : d.rain > 0
                    ? "Mưa nhẹ"
                    : "Không mưa";
                return (
                  <tr key={d.date} className="border-t border-white/10">
                    <Td>{d.label}</Td>
                    <Td>{numCell(d.rain, "mm")}</Td>
                    <Td>{numCell(d.rainProb, "%")}</Td>
                    <Td>{level}</Td>
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
