

// // proxy.ts (root)
// import { NextResponse } from "next/server";
// import type { NextFetchEvent, NextRequest } from "next/server";

// const PUBLIC_PATHS = ["/home", "/discover/login", "/discover/signin", "/"];

// function isPublic(pathname: string) {
//   return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
// }

// function shouldSkip(pathname: string) {
//   return (
//     pathname.startsWith("/_next") ||
//     pathname.startsWith("/favicon") ||
//     pathname === "/robots.txt" ||
//     pathname.startsWith("/sitemap") ||
//     pathname.startsWith("/api") || // ✅ tránh vòng lặp, tránh spam log
//     pathname.endsWith(".png") ||
//     pathname.endsWith(".jpg") ||
//     pathname.endsWith(".jpeg") ||
//     pathname.endsWith(".webp") ||
//     pathname.endsWith(".svg") ||
//     pathname.endsWith(".css") ||
//     pathname.endsWith(".js") ||
//     pathname.endsWith(".map") ||
//     pathname.endsWith(".ico") ||
//     pathname.endsWith(".pbf")
//   );
// }

// // ✅ Next 16: proxy.ts export default function proxy(...) hoặc export function proxy(...)
// export default function proxy(req: NextRequest, event: NextFetchEvent) {
//   const { pathname, searchParams } = req.nextUrl;

//   if (shouldSkip(pathname)) return NextResponse.next();

//   // ✅ log page view (best-effort)
//   if (req.method === "GET") {
//     const accept = req.headers.get("accept") || "";
//     if (accept.includes("text/html")) {
//       const ip =
//         req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
//         req.headers.get("x-real-ip") ??
//         null;

//       const ua = req.headers.get("user-agent") ?? null;

//       const payload = {
//         path: pathname,
//         region_code: searchParams.get("region"),
//         layer_key: searchParams.get("layer"),
//         ip,
//         ua,
//       };

//       const logUrl = new URL("/api/_log/access", req.url);

//       event.waitUntil(
//         fetch(logUrl, {
//           method: "POST",
//           headers: {
//             "content-type": "application/json",
//             "x-log-secret": process.env.LOG_SECRET || "",
//           },
//           body: JSON.stringify(payload),
//         }).catch(() => {})
//       );
//     }
//   }

//   // ✅ public routes
//   if (isPublic(pathname)) return NextResponse.next();

//   // ✅ private routes: yêu cầu access_token
//   const access = req.cookies.get("access_token")?.value;
//   if (!access) {
//     const url = req.nextUrl.clone();
//     url.pathname = "/discover/login";
//     url.search = `?next=${encodeURIComponent(pathname + (req.nextUrl.search || ""))}`;
//     return NextResponse.redirect(url);
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     /* Loại trừ các đường dẫn sau khỏi Middleware */
//     '/((?!api|_next/static|_next/image|favicon.ico|login|signin).*)',
//   ],
// };


// proxy.ts (root)
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

// 1. Định nghĩa chính xác các đường dẫn không cần token
const PUBLIC_PATHS = ["/home", "/discover/login", "/discover/signin", "/"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function shouldSkip(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api") || // Quan trọng: Bỏ qua tất cả /api để tránh loop log
    req.headers.has("x-middleware-skip") ||
    /\.(png|jpg|jpeg|webp|svg|css|js|map|ico|pbf)$/.test(pathname)
  );
}

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  const { pathname, searchParams } = req.nextUrl;

  // BƯỚC 1: Thoát ngay nếu là file tĩnh hoặc API
  if (shouldSkip(req)) return NextResponse.next();

  // BƯỚC 2: Kiểm tra nếu đang ở trang login/signin thì CHO QUA NGAY
  // Đây là chốt chặn quan trọng nhất để sửa lỗi trong ảnh của bạn
  if (pathname.includes("/discover/login") || pathname.includes("/discover/signin")) {
    return NextResponse.next();
  }

  // BƯỚC 3: Logic Log (Giữ nguyên nhưng thêm catch bảo mật)
  if (req.method === "GET" && req.headers.get("accept")?.includes("text/html")) {
    const logUrl = new URL("/api/_log/access", req.url);
    event.waitUntil(
      fetch(logUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-log-secret": process.env.LOG_SECRET || "",
          "x-middleware-skip": "true",
        },
        body: JSON.stringify({ path: pathname, ua: req.headers.get("user-agent") }),
      }).catch(() => {})
    );
  }

  // BƯỚC 4: Kiểm tra Public Routes
  if (isPublic(pathname)) return NextResponse.next();

  // BƯỚC 5: Kiểm tra Token cho các trang Private
  const access = req.cookies.get("access_token")?.value;

  if (!access) {
    const url = req.nextUrl.clone();
    url.pathname = "/discover/login";
    // Tránh truyền tham số next lặp đi lặp lại
    if (!pathname.includes("/discover/login")) {
        url.searchParams.set("next", pathname + (req.nextUrl.search || ""));
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// BƯỚC 6: Matcher cực kỳ quan trọng - Loại trừ thẳng tên thư mục chứa trang login
export const config = {
  matcher: [
    /*
     * Khớp tất cả trừ:
     * api, _next, các file tĩnh và ĐẶC BIỆT là cụm từ 'discover' (chứa login/signin)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|discover|home|$).*)',
  ],
};