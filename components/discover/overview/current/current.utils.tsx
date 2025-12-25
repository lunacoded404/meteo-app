// components/discover/overview/current/current.utils.tsx

import type { CurrentWeather } from "./current.types";

export function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export function describeWeather(d: CurrentWeather | null, loading?: boolean) {
  if (loading) return "Đang tải dữ liệu thời tiết…";
  if (!d) return "Chưa có dữ liệu thời tiết cho khu vực này.";

  const t = d.temperature_c;
  const rain = d.precipitation_mm;
  const cloud = d.cloud_percent;
  const hum = d.humidity_percent;
  const wind = d.wind_kmh;

  const tempText =
    t == null
      ? "Nhiệt độ hiện chưa rõ."
      : t >= 35
      ? `Thời tiết đang rất nóng, khoảng ${Math.round(t)}°C.`
      : t >= 30
      ? `Thời tiết khá nóng, khoảng ${Math.round(t)}°C.`
      : t >= 24
      ? `Thời tiết dễ chịu, khoảng ${Math.round(t)}°C.`
      : t >= 18
      ? `Thời tiết mát, khoảng ${Math.round(t)}°C.`
      : `Trời khá lạnh, khoảng ${Math.round(t)}°C.`;

  const cloudText =
    cloud == null
      ? ""
      : cloud >= 85
      ? "Bầu trời nhiều mây và khá u ám."
      : cloud >= 55
      ? "Mây rải rác, trời hơi âm u."
      : cloud >= 25
      ? "Trời có mây nhẹ, đôi lúc có nắng."
      : "Trời khá quang mây.";

  const rainText =
    rain == null
      ? ""
      : rain >= 10
      ? "Hiện có mưa đáng kể, khả năng đường trơn và tầm nhìn giảm."
      : rain >= 3
      ? "Đang có mưa vừa, bạn nên mang theo áo mưa."
      : rain > 0
      ? "Có mưa nhẹ lác đác."
      : "Hiện tại không có mưa.";

  const humText =
    hum == null
      ? ""
      : hum >= 90
      ? "Độ ẩm rất cao nên có cảm giác oi bức."
      : hum >= 75
      ? "Độ ẩm cao, cảm giác hơi oi."
      : hum >= 55
      ? "Độ ẩm ở mức vừa phải."
      : "Không khí khá khô.";

  const windText =
    wind == null
      ? ""
      : wind >= 35
      ? `Gió khá mạnh khoảng ${Math.round(wind)} km/h, ra ngoài nên chú ý an toàn.`
      : wind >= 18
      ? `Có gió vừa khoảng ${Math.round(wind)} km/h.`
      : `Gió nhẹ khoảng ${Math.round(wind)} km/h.`;

  return [tempText, cloudText, rainText, humText, windText].filter(Boolean).join(" ");
}
