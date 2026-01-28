// app/admin/users/page.tsx
import UsersClient from "./ui";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
};

export const dynamic = "force-dynamic";

async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) throw new Error("Missing host header");
  return `${proto}://${host}`;
}

async function api<T>(path: string): Promise<T> {
  const h = await headers();
  const cookie = h.get("cookie") ?? "";

  const origin = await getOrigin();
  const url = new URL(path, origin);

  const res = await fetch(url, {
    cache: "no-store",
    headers: { cookie },
  });

  // ✅ không crash 500 nữa
  if (res.status === 401) {
    redirect(`/discover/login?next=/admin/users`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetch failed: ${res.status}${text ? ` - ${text}` : ""}`);
  }

  return res.json();
}

export default async function UsersPage() {
  const data = await api<AdminUser[]>("/api/admin/users/");
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Quản lý Users</h1>
      <UsersClient initial={data} />
    </div>
  );
}
