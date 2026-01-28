import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

function forward(res: Response) {
  const contentType = res.headers.get("content-type") ?? "application/json";
  return new NextResponse(res.body, { status: res.status, headers: { "content-type": contentType } });
}

async function getCookie(name: string) {
  const store = await cookies();
  return store.get(name)?.value ?? null;
}

async function setCookie(name: string, value: string) {
  const store = await cookies();
  store.set(name, value, { httpOnly: true, sameSite: "lax", path: "/" });
}

async function refreshAccess(): Promise<string | null> {
  const refresh = await getCookie("refresh_token");
  if (!refresh) return null;

  const r = await fetch(new URL("/api/token/refresh/", API_BASE), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });

  if (!r.ok) return null;
  const data = (await r.json()) as { access?: string };
  if (!data?.access) return null;

  await setCookie("access_token", data.access);
  return data.access;
}

async function authedFetch(url: string, init?: RequestInit) {
  const access = ((await getCookie("access_token")) ?? "").replace(/^Bearer\s+/i, "");
  const headers: Record<string, string> = { ...(init?.headers as any) };
  if (access) headers.Authorization = `Bearer ${access}`;

  let res = await fetch(url, { ...init, headers, cache: "no-store" });

  if (res.status === 401) {
    const text = await res.clone().text().catch(() => "");
    const expired = text.includes("token_not_valid") || text.includes("Token is expired") || text.includes("expired");
    if (expired) {
      const newAccess = await refreshAccess();
      if (newAccess) {
        headers.Authorization = `Bearer ${newAccess}`;
        res = await fetch(url, { ...init, headers, cache: "no-store" });
      }
    }
  }
  return res;
}

// Next 16: params là Promise
type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const upstream = new URL(`/api/admin/users/${id}/set-password/`, API_BASE);
  const body = await req.text();

  const res = await authedFetch(upstream.toString(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });

  return forward(res);
}
