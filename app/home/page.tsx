// app/page.tsx
import Link from "next/link";
import {
  LogIn,
  MapPinned,
  Layers,
  Database,
  Cloud,
  BarChart3,
  Shield,
} from "lucide-react";

type TechItem = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  tags: string[];
};

export function TechCard({ item }: { item: TechItem }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl border border-white/10 bg-black/20 p-2">
          {item.icon}
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold leading-tight">{item.title}</div>
          <div className="mt-1 text-[13px] text-white/70 leading-relaxed">
            {item.desc}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {item.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[12px] text-white/80"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const tech: TechItem[] = [
    {
      icon: <MapPinned className="h-5 w-5" />,
      title: "Frontend WebGIS",
      desc: "UI/UX, routing, SSR/CSR theo App Router và hiển thị bản đồ tương tác.",
      tags: ["Next.js (App Router)", "React", "Tailwind CSS"],
    },
    {
      icon: <Layers className="h-5 w-5" />,
      title: "Bản đồ & lớp dữ liệu",
      desc: "Render layer bản đồ và lớp dữ liệu thời tiết/ranh giới hành chính.",
      tags: ["Leaflet / React-Leaflet", "GeoJSON", "Vector layers"],
    },
    {
      icon: <Cloud className="h-5 w-5" />,
      title: "Nguồn dữ liệu thời tiết",
      desc: "Lấy forecast/observations và chuẩn hoá dữ liệu theo khu vực (lat/lon).",
      tags: ["Open-Meteo API", "Timezone auto", "Daily/Hourly"],
    },
    {
      icon: <Database className="h-5 w-5" />,
      title: "Backend & CSDL không gian",
      desc: "API tổng hợp dữ liệu, cache, truy vấn không gian và lưu trữ.",
      tags: ["Django", "Django REST", "Supabase Postgres", "PostGIS"],
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Biểu đồ & phân tích",
      desc: "Trực quan hoá chuỗi thời gian và xu hướng theo ngày/giờ.",
      tags: ["ECharts", "Time-series", "Trend panels"],
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Auth & Admin",
      desc: "Đăng nhập để vào khu vực quản trị/cấu hình lớp dữ liệu.",
      tags: ["Supabase Auth (tuỳ chọn)", "RBAC (tuỳ chọn)"],
    },
  ];

  return (
    <div className="relative">
      {/* nền gradient nhẹ */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-160px] h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-[-140px] bottom-[-180px] h-[380px] w-[520px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-12">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-10 backdrop-blur">
          {/* Login icon */}
          <div className="absolute right-4 top-4">
            <Link
              href="/discover/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[13px] text-white/90 hover:bg-black/30 transition"
              aria-label="Đăng nhập"
              title="Đăng nhập"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </Link>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
              WebGIS Meteorology • Vietnam
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
              Nền tảng WebGIS thời tiết
            </h1>
            <p className="mt-3 text-[14px] sm:text-[15px] leading-relaxed text-white/70">
              Trang này giới thiệu <span className="text-white/90 font-medium">công nghệ</span> dùng để xây dựng WebGIS
              hiển thị dữ liệu dự báo theo khu vực (nhiệt độ, độ ẩm, mây, mưa, gió) và trực quan hoá bằng biểu đồ.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/discover/overview"
                className="inline-flex items-center justify-center rounded-2xl bg-white text-gray-900 px-4 py-2.5 text-[14px] font-semibold hover:bg-white/90 transition"
              >
                Vào Discover
              </Link>
              <Link
                href="/discover/forecast"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-[14px] font-medium text-white/90 hover:bg-white/10 transition"
              >
                Xem Forecast
              </Link>
            </div>
          </div>
        </section>

        {/* TECH GRID */}
        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Công nghệ sử dụng</h2>
              <p className="mt-1 text-[13px] text-white/65">
                Tóm tắt stack cho WebGIS (frontend, backend, dữ liệu không gian, API thời tiết).
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {tech.map((t) => (
              <TechCard key={t.title} item={t} />
            ))}
          </div>
        </section>

        {/* FOOT NOTE */}
        <div className="mt-10 text-center text-[12px] text-white/50">
          © {new Date().getFullYear()} WebGIS Meteorology • Next.js • Django • Supabase/PostGIS • Open-Meteo
        </div>
      </div>
    </div>
  );
}
