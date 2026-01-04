"use client";
import { Download } from "lucide-react";

export function AdminExportPdfButton({ provinceCode }: { provinceCode: string }) {
  return (
    <button
      type="button"
      onClick={() => window.open(`/api/admin/reports/popup/${provinceCode}/pdf`, "_blank")}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
    >
      <Download className="h-4 w-4" />
      Xuất PDF
    </button>
  );
}
