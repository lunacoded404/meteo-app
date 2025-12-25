"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import type { DailyRow } from "../daily7.types";
import { numCell, round1 } from "../daily7.utils";
import { SectionCard, TableShell, Th, Td } from "../daily7.ui";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

export default function TemperaturePanel({ rows }: { rows: DailyRow[] }) {
  const x = rows.map((d) => d.label);

  const option = useMemo(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { data: ["Tmax", "Tmin"], textStyle: { color: "#cbd5e1" } },
      grid: { left: 48, right: 16, top: 42, bottom: 34 },
      xAxis: { type: "category", data: x, axisLabel: { color: "#cbd5e1" } },
      yAxis: { type: "value", axisLabel: { formatter: "{value} °C", color: "#cbd5e1" } },
      series: [
        { name: "Tmax", type: "line", smooth: true, data: rows.map((d) => d.tmax) },
        { name: "Tmin", type: "line", smooth: true, data: rows.map((d) => d.tmin) },
      ],
    }),
    [rows, x]
  );

  return (
    <SectionCard id="temp" title="Nhiệt độ (°C)" subtitle="Tmax / Tmin theo ngày">
      <ReactECharts option={option} style={{ height: 300, width: "100%" }} notMerge lazyUpdate />

      <TableShell title="Bảng chi tiết nhiệt độ">
        <table className="min-w-[640px] w-full">
          <thead className="bg-white/5">
            <tr>
              <Th>Ngày</Th>
              <Th>Tmax (°C)</Th>
              <Th>Tmin (°C)</Th>
              <Th>Biên độ (°C)</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const amp = d.tmax != null && d.tmin != null ? round1(d.tmax - d.tmin) : null;
              return (
                <tr key={d.date} className="border-t border-white/10">
                  <Td>{d.label}</Td>
                  <Td>{numCell(d.tmax)}</Td>
                  <Td>{numCell(d.tmin)}</Td>
                  <Td>{numCell(amp)}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableShell>
    </SectionCard>
  );
}
