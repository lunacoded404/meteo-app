import "server-only";
import { cookies } from "next/headers";

const BASE = process.env.NEXT_PUBLIC_API_BASE;

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE) throw new Error("Missing NEXT_PUBLIC_API_BASE");

  const store = await cookies();
  const access = store.get("access_token")?.value; // ✅ tên cookie của bạn

  const url = new URL(path, BASE).toString();

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} - ${url}${text ? ` - ${text}` : ""}`);
  }
  return res.json();
}
