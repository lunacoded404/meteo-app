"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { PiX } from "react-icons/pi";

// Dynamic import để tránh lỗi window khi SSR
const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
}) as any;

export type DailyPoint = {
  time: string;
  tmin: number | null;
  tmax: number | null;
};

export type ProvinceWeather = {
  province: {
    id: number;
    code: string;
    name: string;
  };
  coord: {
    lat: number;
    lon: number;
  };
  timezone?: string;
  current: {
    temperature: number | null;
    time: string | null;
  };
  daily_past_7: DailyPoint[];
  daily_future_7: DailyPoint[];
};

export type TemperaturePopupProps = {
  data: ProvinceWeather | null;
  loading: boolean;
  error: string | null;
};

const formatTimeVN = (iso?: string | null) => {
  if (!iso) return "Không rõ";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const hh = d.getHours().toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${hh}h ${dd}/${mm}/${yyyy}`;
};

const formatDateLabel = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = d.getDate().toString().padStart(2, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${dd}/${mm}`;
};

const describeTemp = (t: number | null) => {
  if (t == null) return "Không có dữ liệu nhiệt độ trong ngày.";
  if (t < 20) return "Hôm nay trời khá lạnh, bạn nhớ mang áo khoác.";
  if (t < 28) return "Nhiệt độ hôm nay dễ chịu, thời tiết tương đối thoải mái.";
  if (t < 35) return "Hôm nay trời hơi nóng, nên uống nhiều nước.";
  return "Trời rất nóng, hạn chế ở ngoài trời lâu và chú ý chống nắng.";
};

// Tạo option ECharts cho 1 biểu đồ (KHÔNG title, KHÔNG border ngoài)
const makeChartOption = (
  points: { date: string; tmin: number | null; tmax: number | null }[]
) => ({
  grid: {
    left: 40,
    right: 20,
    top: 20,
    bottom: 70,
  },
  tooltip: {
    trigger: "axis",
    confine: true,
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    textStyle: {
      fontSize: 11,
      color: "#0f172a",
    },
    formatter: (items: any[]) => {
      if (!items || !items.length) return "";
      const name = items[0].axisValue;
      const max = items.find((i: any) => i.seriesName.includes("Cao nhất"));
      const min = items.find((i: any) => i.seriesName.includes("Thấp nhất"));

      const maxVal =
        max && max.data != null ? `${max.data.toFixed(1)} °C` : "—";
      const minVal =
        min && min.data != null ? `${min.data.toFixed(1)} °C` : "—";

      return [
        `Ngày: ${name}`,
        `Cao nhất: ${maxVal}`,
        `Thấp nhất: ${minVal}`,
      ].join("<br/>");
    },
  },
  legend: {
    data: ["Cao nhất (°C)", "Thấp nhất (°C)"],
    bottom: 15,
    textStyle: { fontSize: 11 },
    icon: "circle",
  },
  xAxis: {
    type: "category",
    data: points.map((p) => p.date),
    axisLabel: {
      fontSize: 10,
    },
    axisTick: {
      alignWithLabel: true,
    },
    // 👇 chỉ trục X mới có axisPointer (đường dọc)
    axisPointer: {
      type: "line",
    },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 40,
    interval: 10,
    axisLabel: {
      fontSize: 10,
    },
  },
  series: [
    {
      name: "Cao nhất (°C)",
      type: "line",
      data: points.map((p) => p.tmax),
      smooth: true,
      symbolSize: 6,
      itemStyle: {
        color: "#ff4d4f",
      },
      label: {
        show: true,
        position: "top",
        fontSize: 9,
      },
    },
    {
      name: "Thấp nhất (°C)",
      type: "line",
      data: points.map((p) => p.tmin),
      smooth: true,
      symbolSize: 6,
      itemStyle: {
        color: "#1890ff",
      },
      label: {
        show: true,
        position: "top",
        fontSize: 9,
      },
    },
  ],
});



const TemperaturePopup: React.FC<TemperaturePopupProps> = ({
  data,
  loading,
  error,
}) => {
  if (loading) {
    return <div className="text-xs">Đang tải dữ liệu nhiệt độ...</div>;
  }

  if (error) {
    return <div className="text-xs text-red-600">{error}</div>;
  }

  if (!data) {
    return <div className="text-xs">Không có dữ liệu.</div>;
  }

  const temp = data.current.temperature;
  const time = data.current.time;

  const iconSrc =
    temp != null && temp < 25 ? "/short_temp.png" : "/high_temp.png";

  // Chuẩn hóa dữ liệu 7 ngày tới
  const futurePoints = useMemo(
    () =>
      (data.daily_future_7 || [])
        .slice(0, 7)
        .map((d) => ({
          date: formatDateLabel(d.time),
          tmin: d.tmin,
          tmax: d.tmax,
        })),
    [data.daily_future_7]
  );

  // Chuẩn hóa dữ liệu 7 ngày qua
  const pastPoints = useMemo(() => {
    const arr = data.daily_past_7 || [];
    const slice = arr.slice(-7);
    return slice.map((d) => ({
      date: formatDateLabel(d.time),
      tmin: d.tmin,
      tmax: d.tmax,
    }));
  }, [data.daily_past_7]);

  const futureOption =
    futurePoints.length === 7 ? makeChartOption(futurePoints) : null;

  const pastOption =
    pastPoints.length === 7 ? makeChartOption(pastPoints) : null;

  return (
    <div className="text-[13px] sm:text-sm text-slate-900 w-[420px] max-w-[95vw] space-y-3">
      {/* Header: icon + tên tỉnh + temp hiện tại */}
      <div className="flex items-center gap-3">
        <img
          src={iconSrc}
          alt="Biểu tượng nhiệt độ"
          className="w-9 h-9 flex-shrink-0"
        />
        <div>
          <div className="font-semibold text-sm sm:text-base">
            {data.province.name}
          </div>
          <div className="text-[13px] sm:text-sm">
            Nhiệt độ hiện tại:{" "}
            {temp != null ? `${temp.toFixed(1)} °C` : "Không rõ"}
          </div>
          <div className="text-[13px] sm:text-sm">
            Cập nhật lúc: {formatTimeVN(time)}
          </div>
        </div>
      </div>

      {/* Mô tả */}
      <p className="leading-snug text-[13px] sm:text-sm">
        {describeTemp(temp)}
      </p>

      {/* Title + Biểu đồ 7 ngày tới */}
      {futureOption && (
        <div className="space-y-1">
          <div className="font-semibold">Nhiệt độ 7 ngày tới</div>
          <div className="px-1 py-1">
            <ReactECharts
              option={futureOption}
              style={{ width: "100%", height: 220 }}
              notMerge={true}
              lazyUpdate={true}
            />
          </div>
        </div>
      )}

      {/* Title + Biểu đồ 7 ngày qua */}
      {pastOption && (
        <div className="space-y-1">
          <div className="font-semibold">Nhiệt độ 7 ngày qua</div>
          <div className="px-1 py-1">
            <ReactECharts
              option={pastOption}
              style={{ width: "100%", height: 220 }}
              notMerge={true}
              lazyUpdate={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TemperaturePopup;
