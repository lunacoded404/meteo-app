import { AdminExportPdfButton } from "@/app/admin/reports/AdminExportPdfButton";
import { clamp, fmt } from "@/components/helpers/popupUtils";
import PopupCard, { Stat } from "@/components/PopupCard";

export type ProvinceHumidity = {
  province: { id: number; code: string; name: string };
  coord: { lat: number; lon: number };
  current: {
    humidity_percent: number | null;
    time: string | null;
  };
};

export type HumidityPopupProps = {
  data: ProvinceHumidity | null;
  loading: boolean;
  error: string | null;
  regionName?: string;
};

const formatDateTimeVN = (iso?: string | null) => {
  if (!iso) return "Không rõ";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${hh}:${mi} • ${dd}/${mm}/${yyyy}`;
};

const humidLabelVN = (h: number) => {
  if (h < 40) return "Khá khô";
  if (h < 70) return "Dễ chịu";
  if (h < 85) return "Ẩm cao";
  return "Rất ẩm";
};

const humidDescriptionVN = (h: number) => {
  if (h < 35) return "Không khí khô, có thể gây khô da/khô họng. Nên uống nước và dưỡng ẩm.";
  if (h < 55) return "Độ ẩm ổn định, cảm giác khá dễ chịu.";
  if (h < 70) return "Hơi ẩm, nhưng vẫn tương đối thoải mái.";
  if (h < 85) return "Độ ẩm cao, dễ cảm giác oi. Nên thông gió và uống đủ nước.";
  return "Rất ẩm và dễ oi bức. Hạn chế hoạt động nặng, chú ý phòng nấm mốc.";
};



export default function AdminHumidityPopup ({ data, loading, error, regionName }: HumidityPopupProps) {
    const provinceName = data?.province?.name || regionName || "Không rõ vùng";
  
    const h = data?.current?.humidity_percent ?? null;
    const bar = h == null ? 0 : clamp(h, 0, 100);
  
    const timeText = `Cập nhật lúc: ${formatDateTimeVN(data?.current?.time)}`;
    const desc = h == null ? "Chưa có dữ liệu độ ẩm hiện tại." : humidDescriptionVN(h);

    function fmt(h: number, arg1: number) {
        throw new Error("Function not implemented.");
    }

  return (
    <PopupCard
      icon={<img src="/humid.png" alt="" className="w-6 h-6" draggable={false} />}
      title={provinceName}
      timeText={timeText}
      description={desc}
      loading={loading}
      error={error}
    >
      {!data ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-[12px] text-slate-600 whitespace-normal break-words">
            Chưa có dữ liệu. Hãy chọn một tỉnh để xem.
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500">Hiện tại</div>
              <div className="text-[28px] font-bold leading-none">
                {h == null ? "—" : `${fmt(h, 0)}%`}
              </div>
            </div>

            <div className="flex gap-4">
              <Stat label="Cảm giác" value={h == null ? "—" : humidLabelVN(h)} />
            </div>
          </div>

          <div className="mt-3">
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-slate-900" style={{ width: `${bar}%` }} />
            </div>
          </div>
        </div>
      )}
    {/* ✅ nút export chỉ admin */}
      {data?.province?.code ? (
        <div className="mt-3">
          <AdminExportPdfButton provinceCode={data.province.code} />
        </div>
      ) : null}
    </PopupCard>
  );
}
