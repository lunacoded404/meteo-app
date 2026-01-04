// app/admin/reports/page.tsx
import ReportsClient from "./ui";

export default function AdminReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Analytics & Reports</h1>
      <ReportsClient />
    </div>
  );
}
