// import { NextResponse } from "next/server";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();

//     const r = await fetch(`${process.env.DJANGO_API_BASE}/api/auth/login/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(body),
//       cache: "no-store",
//     });

//     const data = await r.json().catch(() => ({}));

//     if (!r.ok) {
//       return NextResponse.json({ detail: data?.detail || "Đăng nhập thất bại." }, { status: r.status });
//     }

//     // ✅ bắt nhiều dạng key phổ biến
//     const access =
//       data?.access ??
//       data?.access_token ??
//       data?.token ??
//       data?.tokens?.access ??
//       null;

//     const refresh =
//       data?.refresh ??
//       data?.refresh_token ??
//       data?.tokens?.refresh ??
//       null;

//     const res = NextResponse.json({ ok: true });

//     if (access) {
//       res.cookies.set("access_token", String(access), {
//         httpOnly: true,
//         sameSite: "lax",
//         secure: process.env.NODE_ENV === "production",
//         path: "/",
//       });
//     }

//     if (refresh) {
//       res.cookies.set("refresh_token", String(refresh), {
//         httpOnly: true,
//         sameSite: "lax",
//         secure: process.env.NODE_ENV === "production",
//         path: "/",
//       });
//     }

//     return res;
//   } catch {
//     return NextResponse.json({ detail: "Có lỗi khi đăng nhập." }, { status: 500 });
//   }
// }





