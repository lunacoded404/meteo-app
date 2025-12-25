"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import type { DailyRow } from "../daily7.types";
import { numCell } from "../daily7.utils";
import { SectionCard, TableShell, Th, Td } from "../daily7.ui";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as any;

export default function CloudPanel({ rows }: { rows: DailyRow[] }) {
  const x = rows.map((d) => d.label);

  const option = useMemo(
    () => ({
      tooltip: { trigger: "axis" },
      grid: { left: 48, right: 16, top: 18, bottom: 34 },
      xAxis: { type: "category", data: x, axisLabel: { color: "#cbd5e1" } },
      yAxis: { type: "value", min: 0, max: 100, axisLabel: { formatter: "{value} %", color: "#cbd5e1" } },
      series: [{ name: "Cloud", type: "bar", data: rows.map((d) => d.cloud) }],
    }),
    [rows, x]
  );

  return (
    <SectionCard id="cloud" title="Mây che phủ trung bình (%)" subtitle="Trung bình theo ngày">
      <ReactECharts option={option} style={{ height: 300, width: "100%" }} notMerge lazyUpdate />

      <TableShell title="Bảng chi tiết mây che phủ (TB ngày)">
        <table className="min-w-[520px] w-full">
          <thead className="bg-white/5">
            <tr>
              <Th>Ngày</Th>
              <Th>Mây (%)</Th>
              <Th>Mô tả</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const desc =
                d.cloud == null ? "—" : d.cloud >= 85 ? "U ám" : d.cloud >= 60 ? "Nhiều mây" : d.cloud >= 30 ? "Ít mây" : "Quang";
              return (
                <tr key={d.date} className="border-t border-white/10">
                  <Td>{d.label}</Td>
                  <Td>{numCell(d.cloud, "%")}</Td>
                  <Td>{desc}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableShell>
    </SectionCard>
  );
}
