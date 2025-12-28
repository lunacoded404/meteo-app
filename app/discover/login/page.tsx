import { Suspense } from "react";
import LoginPage from "@/components/auth/LoginPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}
