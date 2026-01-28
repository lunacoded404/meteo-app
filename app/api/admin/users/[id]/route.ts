// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"; // ✅ Dùng NextRequest thay cho Request
import { cookies } from "next/headers";

// Định nghĩa kiểu cho params theo chuẩn Next.js 15
type Props = {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// --- Helper Functions (Giữ nguyên logic của bạn nhưng thêm type) ---

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

function forward(up: Response) {
  if (up.status === 204) return new NextResponse(null, { status: 204 });
  const contentType = up.headers.get("content-type") ?? "application/json";
  return new NextResponse(up.body, {
    status: up.status,
    headers: { "content-type": contentType },
  });
}

async function getCookie(name: string) {
  const store = await cookies();
  return store.get(name)?.value ?? null;
}

async function setCookie(name: string, value: string) {
  const store = await cookies();
  store.set(name, value, { httpOnly: true, sameSite: "lax", path: "/" });
}

async function isExpiredTokenResponse(res: Response): Promise<boolean> {
  if (res.status !== 401) return false;
  const text = await res.clone().text().catch(() => "");
  return text.includes("token_not_valid") && (text.includes("expired") || text.includes("Token is expired"));
}

async function refreshAccess(): Promise<string | null> {
  if (!API_BASE) return null;
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

  if (await isExpiredTokenResponse(res)) {
    const newAccess = await refreshAccess();
    if (newAccess) {
      headers.Authorization = `Bearer ${newAccess}`;
      res = await fetch(url, { ...init, headers, cache: "no-store" });
    }
  }
  return res;
}

// --- Main Route Handlers ---

export async function PATCH(req: NextRequest, ctx: Props) {
  try {
    if (!API_BASE) return json(500, { ok: false, error: "Missing NEXT_PUBLIC_API_BASE" });

    // Giải nén params bằng await (bắt buộc)
    const { id } = await ctx.params;
    
    const upstream = new URL(`/api/admin/users/${id}/`, API_BASE);
    const body = await req.text();

    const up = await authedFetch(upstream.toString(), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body,
    });

    return forward(up);
  } catch (e: any) {
    return json(500, { ok: false, error: String(e?.message ?? e) });
  }
}

export async function DELETE(req: NextRequest, ctx: Props) {
  try {
    if (!API_BASE) return json(500, { ok: false, error: "Missing NEXT_PUBLIC_API_BASE" });

    const { id } = await ctx.params;
    const upstream = new URL(`/api/admin/users/${id}/`, API_BASE);

    const up = await authedFetch(upstream.toString(), { method: "DELETE" });

    return forward(up);
  } catch (e: any) {
    return json(500, { ok: false, error: String(e?.message ?? e) });
  }
}