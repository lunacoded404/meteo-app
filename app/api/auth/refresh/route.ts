import { NextResponse } from "next/server";

function getCookieValue(cookieHeader: string, name: string) {
  const m = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function POST(req: Request) {
  const base = process.env.NEXT_PUBLIC_API_BASE!;
  const cookie = req.headers.get("cookie") || "";
  const refresh = getCookieValue(cookie, "refresh_token");

  if (!refresh) {
    return NextResponse.json({ detail: "Missing refresh_token cookie" }, { status: 401 });
  }

  const res = await fetch(`${base}/api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  // ⚠️ Nếu backend trả access trong JSON, bạn cần backend set cookie access_token lại.
  // (Cách chuẩn là backend tự set-cookie access_token khi refresh.)
  return new NextResponse(text || "{}", { status: res.status, headers: { "Content-Type": "application/json" } });
}
