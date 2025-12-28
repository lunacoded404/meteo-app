import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL; // ví dụ: http://127.0.0.1:8000/api

export const config = {
  matcher: ["/api/:path*"],
};

export default async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ✅ Nếu bạn có route handler riêng cho login thì cho nó đi thẳng
  // (proxy sẽ không rewrite nữa)
  if (pathname === "/api/auth/login") {
    return NextResponse.next();
  }

  if (!API_BASE) {
    console.error("[proxy] Missing API_BASE_URL");
    return NextResponse.json(
      { error: "Missing API_BASE_URL env" },
      { status: 500 }
    );
  }

  // Map /api/... -> {API_BASE}/...
  // Ví dụ: /api/provinces -> http://127.0.0.1:8000/api/provinces
  const target =
    API_BASE.replace(/\/$/, "") + pathname.replace(/^\/api/, "") + search;

  try {
    // GET/HEAD không có body
    const body =
      req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();

    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        // chỉ forward những header cần thiết để tránh lỗi lạ
        "content-type": req.headers.get("content-type") ?? "application/json",
        authorization: req.headers.get("authorization") ?? "",
        cookie: req.headers.get("cookie") ?? "",
      },
      body,
      redirect: "manual",
    });

    const text = await upstream.text();

    const res = new NextResponse(text, { status: upstream.status });

    const ct = upstream.headers.get("content-type");
    if (ct) res.headers.set("content-type", ct);

    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) res.headers.set("set-cookie", setCookie);

    return res;
  } catch (e: any) {
    console.error("[proxy] FETCH FAILED:", { target, message: e?.message, e });
    return NextResponse.json(
      { error: "Proxy fetch failed", target, detail: String(e?.message ?? e) },
      { status: 502 }
    );
  }
}
