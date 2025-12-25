"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import type { DailyRow } from "../daily7.types";
import { numCell } from "../daily7.utils";
import { SectionCard, TableShell, Th, Td } from "../daily7.ui";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

export default function WindPanel({ rows }: { rows: DailyRow[] }) {
  const x = rows.map((d) => d.label);

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const p = params?.[0];
          const idx = p?.dataIndex ?? 0;
          const dir = rows[idx]?.windDir;
          const dirLabel = rows[idx]?.windDirLabel;
          const dirText = dir == null ? "—" : `${Math.round(dir)}°${dirLabel ? ` (${dirLabel})` : ""}`;
          return `${p?.axisValue}<br/>Gió max: ${p?.data ?? "—"} km/h<br/>Hướng dominant: ${dirText}`;
        },
      },
      grid: { left: 48, right: 16, top: 18, bottom: 34 },
      xAxis: { type: "category", data: x, axisLabel: { color: "#cbd5e1" } },
      yAxis: { type: "value", axisLabel: { formatter: "{value} km/h", color: "#cbd5e1" } },
      series: [{ name: "Wind max", type: "line", smooth: true, data: rows.map((d) => d.wind) }],
    }),
    [rows, x]
  );

  return (
    <SectionCard id="wind" title="Gió lớn nhất (km/h)" subtitle="Max theo ngày + hướng dominant">
      <ReactECharts option={option} style={{ height: 300, width: "100%" }} notMerge lazyUpdate />

      <TableShell title="Bảng chi tiết gió (max ngày)">
        <table className="min-w-[720px] w-full">
          <thead className="bg-white/5">
            <tr>
              <Th>Ngày</Th>
              <Th>Gió max (km/h)</Th>
              <Th>Hướng dominant</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.date} className="border-t border-white/10">
                <Td>{d.label}</Td>
                <Td>{numCell(d.wind, " km/h")}</Td>
                <Td>{d.windDir == null ? "—" : `${Math.round(d.windDir)}°${d.windDirLabel ? ` (${d.windDirLabel})` : ""}`}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </SectionCard>
  );
}
