"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import type { DailyRow } from "../daily7.types";
import { numCell } from "../daily7.utils";
import { SectionCard, TableShell, Th, Td } from "../daily7.ui";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

export default function RainPanel({ rows }: { rows: DailyRow[] }) {
  const x = rows.map((d) => d.label);

  const option = useMemo(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { data: ["Rain (mm)", "Prob (%)"], textStyle: { color: "#cbd5e1" } },
      grid: { left: 48, right: 48, top: 42, bottom: 34 },
      xAxis: { type: "category", data: x, axisLabel: { color: "#cbd5e1" } },
      yAxis: [
        { type: "value", axisLabel: { formatter: "{value} mm", color: "#cbd5e1" } },
        { type: "value", min: 0, max: 100, axisLabel: { formatter: "{value} %", color: "#cbd5e1" } },
      ],
      series: [
        { name: "Rain (mm)", type: "bar", data: rows.map((d) => d.rain) },
        { name: "Prob (%)", type: "line", yAxisIndex: 1, smooth: true, data: rows.map((d) => d.rainProb) },
      ],
    }),
    [rows, x]
  );

  return (
    <SectionCard id="rain" title="Mưa (mm) + Xác suất mưa (%)" subtitle="Cột: mm | Line: %">
      <ReactECharts option={option} style={{ height: 320, width: "100%" }} notMerge lazyUpdate />

      <TableShell title="Bảng chi tiết mưa (tổng mm) + xác suất (max)">
        <table className="min-w-[720px] w-full">
          <thead className="bg-white/5">
            <tr>
              <Th>Ngày</Th>
              <Th>Lượng mưa (mm)</Th>
              <Th>Xác suất max (%)</Th>
              <Th>Mức độ</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const level =
                d.rain == null ? "—" : d.rain >= 30 ? "Mưa rất to" : d.rain >= 15 ? "Mưa to" : d.rain >= 5 ? "Mưa vừa" : d.rain > 0 ? "Mưa nhẹ" : "Không mưa";
              return (
                <tr key={d.date} className="border-t border-white/10">
                  <Td>{d.label}</Td>
                  <Td>{numCell(d.rain, " mm")}</Td>
                  <Td>{numCell(d.rainProb, "%")}</Td>
                  <Td>{level}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableShell>
    </SectionCard>
  );
}
