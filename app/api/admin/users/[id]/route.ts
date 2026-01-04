import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

function forward(res: Response) {
  const contentType = res.headers.get("content-type") ?? "application/json";
  return new NextResponse(res.body, { status: res.status, headers: { "content-type": contentType } });
}

async function getAccess(): Promise<string | null> {
  const store = await cookies();
  const v = store.get("access_token")?.value ?? null;
  return v ? v.replace(/^Bearer\s+/i, "") : null;
}

async function refreshAccess(): Promise<string | null> {
  const store = await cookies();
  const refresh = store.get("refresh_token")?.value;
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

  store.set("access_token", data.access, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // secure: true,
  });

  return data.access;
}

async function forwardAuthFetch(input: string, init?: RequestInit) {
  const access = await getAccess();
  const headers: Record<string, string> = { ...(init?.headers as any) };

  if (access) headers["Authorization"] = `Bearer ${access}`;

  let res = await fetch(input, { ...init, headers, cache: "no-store" });

  if (res.status === 401) {
    const cloned = res.clone();
    const text = await cloned.text().catch(() => "");
    if (text.includes("token_not_valid") || text.includes("Token is expired") || text.includes("not valid")) {
      const newAccess = await refreshAccess();
      if (newAccess) {
        headers["Authorization"] = `Bearer ${newAccess}`;
        res = await fetch(input, { ...init, headers, cache: "no-store" });
      }
    }
  }

  return res;
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const upstream = new URL(`/api/admin/users/${ctx.params.id}/`, API_BASE);
  const body = await req.text();

  const res = await forwardAuthFetch(upstream.toString(), {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body,
  });

  return forward(res);
}

export async function DELETE(_: Request, ctx: { params: { id: string } }) {
  const upstream = new URL(`/api/admin/users/${ctx.params.id}/`, API_BASE);

  const res = await forwardAuthFetch(upstream.toString(), { method: "DELETE" });
  return forward(res);
}
