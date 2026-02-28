"use client";
import PopupCard, { Stat } from "../PopupCard";
import { fmt } from "../helpers/popupUtils";
import { AdminExportPdfButton } from "@/app/admin/reports/AdminExportPdfButton";

export type ProvinceCloud = {
  province: { id: number; code: string; name: string };
  coord: { lat: number; lon: number };
  timezone?: string;
  current: {
    time: string | null;
    cloud_cover_percent: number | null;
    visibility_m?: number | null; 
  };
};

export type CloudPopupProps = {
  data: ProvinceCloud | null;
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

const cloudLabelVN = (c: number) => {
  if (c < 20) return "Trời quang";
  if (c < 50) return "Mây rải rác";
  if (c < 80) return "Nhiều mây";
  return "U ám";
};

const cloudDescriptionVN = (c: number) => {
  if (c < 20) return "Ít mây, trời quang đãng.";
  if (c < 50) return "Mây rải rác, ánh nắng có thể xen kẽ.";
  if (c < 80) return "Nhiều mây, nắng giảm và trời có thể âm u.";
  return "U ám, ánh sáng giảm rõ rệt.";
};

const formatVisibilityKm = (m?: number | null) => {
  if (m == null || Number.isNaN(m)) return null;
  return m / 1000;
};

export default function CloudPopup({ data, loading, error, regionName }: CloudPopupProps) {
  const provinceName = data?.province?.name || regionName || "Không rõ vùng";

  const cloud = data?.current?.cloud_cover_percent ?? null;
  const visKm = formatVisibilityKm(data?.current?.visibility_m);

  const timeText = `Cập nhật lúc: ${formatDateTimeVN(data?.current?.time)}`;
  const desc = cloud == null ? "Chưa có dữ liệu mây hiện tại." : cloudDescriptionVN(cloud);

  const code = data?.province?.code; 


  return (
    <PopupCard
      icon={<img src="/cloud.png" alt="" className="w-6 h-6" draggable={false} />}
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
                {cloud == null ? "—" : `${fmt(cloud, 0)}%`}
              </div>
            </div>

            <div className="flex gap-4">
              <Stat label="Trạng thái" value={cloud == null ? "—" : cloudLabelVN(cloud)} />
              {visKm != null && <Stat label="Tầm nhìn" value={`${fmt(visKm, 1)} km`} />}
            </div>
          </div>
        </div>
      )}
      <div className="mt-3 flex justify-end">
        {code ? <AdminExportPdfButton provinceCode={code} /> : null}
      </div>
    </PopupCard>
  );
}
