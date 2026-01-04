// app/api/track/region/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.province_code || !body?.source) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_API_BASE!; // ví dụ http://localhost:8000
  const res = await fetch(`${base}/api/track/region/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  return new NextResponse(text || "{}", {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
