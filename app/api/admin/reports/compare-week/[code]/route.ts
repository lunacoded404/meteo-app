import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ code: string }> } // ✅ params là Promise ở Next mới
) {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE;
    if (!base) return NextResponse.json({ detail: "NEXT_PUBLIC_API_BASE missing" }, { status: 500 });

    // ✅ phải await
    const { code } = await ctx.params;

    if (!code || code === "undefined" || code === "null") {
      return NextResponse.json({ detail: "Missing province code in route param" }, { status: 400 });
    }

    const url = new URL(req.url);
    const upstream = `${base}/api/admin/reports/compare-week/${encodeURIComponent(code)}/${url.search}`;

    const res = await fetch(upstream, {
      method: "GET",
      headers: {
        cookie: req.headers.get("cookie") || "", // ✅ forward cookie để backend auth admin
      },
      cache: "no-store",
    });

    const ct = res.headers.get("content-type") || "";
    const text = await res.text().catch(() => "");

    // ✅ nếu upstream trả HTML (debug page) thì trả JSON để client không bị lỗi parse
    if (!ct.includes("application/json")) {
      return NextResponse.json(
        { detail: "Upstream returned non-JSON", status: res.status, upstream_preview: text.slice(0, 300) },
        { status: res.status === 200 ? 502 : res.status }
      );
    }

    return new NextResponse(text || "{}", {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "Proxy crashed" }, { status: 500 });
  }
}
