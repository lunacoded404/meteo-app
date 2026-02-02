import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const r = await fetch(`${process.env.DJANGO_API_BASE}/api/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return NextResponse.json(
        { detail: data?.detail || "Đăng ký thất bại." },
        { status: r.status }
      );
    }

    return NextResponse.json({ ok: true, ...data }, { status: 200 });
  } catch {
    return NextResponse.json({ detail: "Có lỗi khi đăng ký." }, { status: 500 });
  }
}
