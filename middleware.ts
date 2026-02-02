

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


// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 1. SKIP LIST: Bỏ qua các file tĩnh và API routes để tránh vòng lặp
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") || // Quan trọng: Để API Login/Register không bị chặn
    pathname.includes(".") ||      // Bỏ qua favicon, ảnh, v.v.
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // 2. PUBLIC PATHS: Các trang không cần đăng nhập
  const PUBLIC_PATHS = ["/", "/home", "/discover/login", "/discover/signin"];
  const isPublicPage = PUBLIC_PATHS.some((p) => pathname === p);

  // 3. AUTH CHECK: Kiểm tra cookie access_token
  const accessToken = req.cookies.get("access_token")?.value;

  // Trường hợp: Đã đăng nhập mà cố tình vào trang Login/Signin
  if (accessToken && (pathname === "/discover/login" || pathname === "/discover/signin")) {
    return NextResponse.redirect(new URL("/discover/overview", req.url));
  }

  // Trường hợp: Chưa đăng nhập mà vào trang Private
  if (!accessToken && !isPublicPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/discover/login";
    // Lưu lại trang đang định vào để sau khi login xong quay lại (next parameter)
    url.searchParams.set("next", pathname + (req.nextUrl.search || ""));
    return NextResponse.redirect(url);
  }

  // 4. LOGGING (Optional - Giữ lại logic của bạn nhưng tối ưu hơn)
  // Chỉ log view khi user truy cập các trang HTML thực sự
  if (req.method === "GET" && !pathname.startsWith("/api")) {
    const accept = req.headers.get("accept") || "";
    if (accept.includes("text/html")) {
      // Thực hiện gọi API log ẩn (background)
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const logUrl = new URL("/api/_log/access", req.url);
      
      // Không dùng await để tránh làm chậm tốc độ load trang của user
      fetch(logUrl, {
        method: "POST",
        headers: { 
          "content-type": "application/json",
          "x-log-secret": process.env.LOG_SECRET || "" 
        },
        body: JSON.stringify({
          path: pathname,
          ip: ip,
          ua: req.headers.get("user-agent"),
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.next();
}

// 5. MATCHER CONFIG: Định nghĩa những path nào middleware sẽ chạy qua
export const config = {
  matcher: [
    /*
     * Match tất cả trừ:
     * 1. api (nếu bạn muốn middleware không xử lý api chút nào)
     * 2. _next/static (static files)
     * 3. _next/image (image optimization files)
     * 4. favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

