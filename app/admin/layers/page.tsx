// app/admin/layers/page.tsx
import { api } from "@/lib/adminApi";
import LayersClient from "./ui";

export type MapLayer = {
  id: number;
  key: string;
  name: string;
  is_enabled: boolean;
  icon?: string | null;
};

export default async function LayersPage() {
  const data = await api<MapLayer[]>("/api/admin/layers/");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      {/* header */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">Quản lý layers</h1>
            <p className="text-sm text-white/60">
              Bật/tắt layer và đổi icon hiển thị trên bản đồ.
            </p>
          </div>
        </div>
      </div>

      <LayersClient initial={data} />
    </div>
  );
}
