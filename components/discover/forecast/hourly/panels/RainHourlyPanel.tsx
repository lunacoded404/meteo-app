"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";

import type { HourlyPoint } from "../hourly.types";
import { fmtHourLabelVN, fmtDateVN, fmtDateTimeVN, numCell } from "../hourly.utils";
import { SectionCard, TableShell, Th, Td } from "../hourly.ui";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

export default function RainHourlyPanel({ points, day }: { points: HourlyPoint[]; day: string }) {
  const [open, setOpen] = useState(false);
  const x = points.map((p) => fmtHourLabelVN(p.time));

  const option = useMemo(
    () => ({
      tooltip: { trigger: "axis" },
      legend: {
        data: ["Mưa (mm)", "Xác suất mưa (%)"],
        bottom: 8,
        left: "center",
        textStyle: { color: "#cbd5e1" },
      },
      grid: { left: 56, right: 56, top: 18, bottom: 64 },
      xAxis: { type: "category", data: x, axisLabel: { color: "#cbd5e1" } },
      yAxis: [
        { type: "value", axisLabel: { formatter: "{value} mm", color: "#cbd5e1" } },
        { type: "value", min: 0, max: 100, axisLabel: { formatter: "{value} %", color: "#cbd5e1" } },
      ],
      series: [
        {
          name: "Mưa (mm)",
          type: "bar",
          data: points.map((p) => p.rain_mm),
          barMaxWidth: 26,
          tooltip: { valueFormatter: (v: any) => (v == null ? "—" : `${Number(v)} mm`) },
        },
        {
          name: "Xác suất mưa (%)",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          data: points.map((p) => p.rain_prob_percent),
          tooltip: { valueFormatter: (v: any) => (v == null ? "—" : `${Math.round(Number(v))}%`) },
        },
      ],
    }),
    [points, x]
  );

  return (
    <SectionCard id="h-rain" title="Mưa theo giờ" subtitle={`24 giờ — ${fmtDateVN(day)}`}>
      <ReactECharts option={option} style={{ height: 320, width: "100%" }} notMerge lazyUpdate />

      <div className="mt-2 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-slate-100 hover:bg-white/10"
        >
          <Menu className="h-4 w-4" />
          Chi tiết 24 giờ
        </button>
      </div>

      {open ? (
        <TableShell title="Bảng mưa 24 giờ">
          <table className="min-w-[920px] w-full">
            <thead className="bg-white/5">
              <tr>
                <Th>Thời điểm</Th>
                <Th>Mưa (mm)</Th>
                <Th>Xác suất (%)</Th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.time} className="border-t border-white/10">
                  <Td>{fmtDateTimeVN(p.time)}</Td>
                  <Td>{numCell(p.rain_mm, "mm")}</Td>
                  <Td>{numCell(p.rain_prob_percent, "%")}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      ) : null}
    </SectionCard>
  );
}
