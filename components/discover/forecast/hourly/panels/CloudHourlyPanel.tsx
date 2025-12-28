"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";

import type { HourlyPoint } from "../hourly.types";
import { fmtHourLabelVN, fmtDateVN, fmtDateTimeVN, numCell } from "../hourly.utils";
import { SectionCard, TableShell, Th, Td } from "../hourly.ui";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

export default function CloudHourlyPanel({ points, day }: { points: HourlyPoint[]; day: string }) {
  const [open, setOpen] = useState(false);
  const x = points.map((p) => fmtHourLabelVN(p.time));

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        valueFormatter: (v: any) => (v == null || Number.isNaN(Number(v)) ? "—" : `${Math.round(Number(v))}%`),
      },
      legend: { data: ["Mây che phủ (%)"], bottom: 8, left: "center", textStyle: { color: "#cbd5e1" } },
      grid: { left: 52, right: 18, top: 18, bottom: 64 },
      xAxis: { type: "category", data: x, axisLabel: { color: "#cbd5e1" } },
      yAxis: { type: "value", min: 0, max: 100, axisLabel: { formatter: "{value} %", color: "#cbd5e1" } },
      series: [{ name: "Mây che phủ (%)", type: "bar", data: points.map((p) => p.cloud_percent), barMaxWidth: 26 }],
    }),
    [points, x]
  );

  return (
    <SectionCard id="h-cloud" title="Mây che phủ theo giờ" subtitle={`24 giờ — ${fmtDateVN(day)}`}>
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
        <TableShell title="Bảng mây che phủ 24 giờ">
          <table className="min-w-[760px] w-full">
            <thead className="bg-white/5">
              <tr>
                <Th>Thời điểm</Th>
                <Th>Mây (%)</Th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.time} className="border-t border-white/10">
                  <Td>{fmtDateTimeVN(p.time)}</Td>
                  <Td>{numCell(p.cloud_percent, "%")}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      ) : null}
    </SectionCard>
  );
}
