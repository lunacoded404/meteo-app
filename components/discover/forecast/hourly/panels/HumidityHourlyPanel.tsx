"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";

import type { HourlyPoint } from "../hourly.types";
import { fmtHourLabelVN, fmtDateVN, fmtDateTimeVN, numCell } from "../hourly.utils";
import { SectionCard, TableShell, Th, Td } from "../hourly.ui";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

export default function HumidityHourlyPanel({ points, day }: { points: HourlyPoint[]; day: string }) {
  const [open, setOpen] = useState(false);
  const x = points.map((p) => fmtHourLabelVN(p.time));

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        valueFormatter: (val: any) =>
          val == null || Number.isNaN(Number(val)) ? "—" : `${Math.round(Number(val))}%`,
      },
      legend: {
        data: ["Độ ẩm tương đối (%)"],
        bottom: 8,
        left: "center",
        textStyle: { color: "#cbd5e1" },
      },
      grid: { left: 52, right: 18, top: 18, bottom: 64 },
      xAxis: { type: "category", data: x, axisLabel: { color: "#cbd5e1" } },
      yAxis: { type: "value", min: 0, max: 100, axisLabel: { formatter: "{value} %", color: "#cbd5e1" } },
      series: [
        {
          name: "Độ ẩm tương đối (%)",
          type: "line",
          smooth: true,
          areaStyle: {},
          data: points.map((p) => p.humidity_percent),
        },
      ],
    }),
    [points, x]
  );

  return (
    <SectionCard id="h-humidity" title="Độ ẩm theo giờ" subtitle={`24 giờ — ${fmtDateVN(day)}`}>
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
        <TableShell title="Bảng độ ẩm 24 giờ">
          <table className="min-w-[760px] w-full">
            <thead className="bg-white/5">
              <tr>
                <Th>Thời điểm</Th>
                <Th>Độ ẩm (%)</Th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.time} className="border-t border-white/10">
                  <Td>{fmtDateTimeVN(p.time)}</Td>
                  <Td>{numCell(p.humidity_percent, "%")}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      ) : null}
    </SectionCard>
  );
}
