// app/api/auth/refresh/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "";

export async function POST() {
  const jar = await cookies();
  const refresh = jar.get("refresh_token")?.value;

  if (!refresh) {
    return NextResponse.json({ detail: "Missing refresh_token" }, { status: 401 });
  }


  const url = `${BACKEND}/api/token/refresh/`;

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });

  const text = await r.text().catch(() => "");
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  if (!r.ok) {
    return NextResponse.json(
      { detail: data?.detail || data?.message || "Refresh failed", raw: data ?? text },
      { status: r.status }
    );
  }

  const access = data?.access;
  if (!access) {
    return NextResponse.json({ detail: "No access token returned" }, { status: 500 });
  }

  // ✅ set cookie access_token mới
  jar.set("access_token", access, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // maxAge: 60 * 15, // (tuỳ)
  });

  return NextResponse.json({ ok: true });
}
