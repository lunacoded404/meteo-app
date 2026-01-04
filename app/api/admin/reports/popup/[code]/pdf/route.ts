import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ code: string }> } // ✅ Next mới: params là Promise
) {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE;
    if (!base) return NextResponse.json({ detail: "NEXT_PUBLIC_API_BASE missing" }, { status: 500 });

    const { code } = await ctx.params;
    if (!code || code === "undefined" || code === "null") {
      return NextResponse.json({ detail: "Missing province code" }, { status: 400 });
    }

    const url = new URL(req.url);
    // ✅ Django endpoint nên có trailing slash
    const upstream = `${base}/api/admin/reports/popup/${encodeURIComponent(code)}/pdf/${url.search}`;

    const res = await fetch(upstream, {
      method: "GET",
      headers: {
        cookie: req.headers.get("cookie") || "", // ✅ forward auth cookie
      },
      cache: "no-store",
    });

    // nếu upstream trả JSON lỗi thì forward nguyên văn (để debug)
    const ct = res.headers.get("content-type") || "";
    if (!res.ok && ct.includes("application/json")) {
      const text = await res.text().catch(() => "");
      return new NextResponse(text || "{}", {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // pass-through PDF stream + headers quan trọng
    const headers = new Headers();
    headers.set("Content-Type", ct || "application/pdf");

    const cd = res.headers.get("content-disposition");
    if (cd) headers.set("Content-Disposition", cd);
    else headers.set("Content-Disposition", `attachment; filename="popup_${code}.pdf"`);

    return new NextResponse(res.body, { status: res.status, headers });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "Proxy crashed" }, { status: 500 });
  }
}
