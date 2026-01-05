// app/discover/overview/page.tsx (hoặc app/about/page.tsx)
// Server Component mặc định (không cần "use client")

import Link from "next/link";
import {
  Globe,
  Layers,
  MapPin,
  CloudSun,
  Database,
  Server,
  ShieldCheck,
  BarChart3,
  Gauge,
  Sparkles,
  Code2,
  GitBranch,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

type StackItem = {
  title: string;
  desc: string;
  icon: React.ReactNode;
  tags: string[];
};

type FeatureItem = {
  title: string;
  desc: string;
  icon: React.ReactNode;
};

const STACK: StackItem[] = [
  {
    title: "Next.js (App Router) + React",
    desc: "UI hiện đại, routing tối ưu, SSR/CSR linh hoạt cho dashboard và bản đồ.",
    icon: <Code2 className="h-5 w-5" />,
    tags: ["App Router", "TypeScript", "Tailwind"],
  },
  {
    title: "Leaflet / React-Leaflet",
    desc: "Hiển thị bản đồ WebGIS, lớp nền, tương tác popup/tooltip.",
    icon: <MapPin className="h-5 w-5" />,
    tags: ["Map", "Tiles"],
  },
  {
    title: "Weather Layer + Open-Meteo API",
    desc: "Layer thời tiết (nhiệt độ, mây, gió, mưa, độ ẩm) và dự báo theo giờ/ngày.",
    icon: <CloudSun className="h-5 w-5" />,
    tags: ["Forecast", "Archive", "Trends"],
  },
  {
    title: "Django + Django REST Framework",
    desc: "Backend API, chuẩn hoá dữ liệu, cache, phân quyền admin/user.",
    icon: <Server className="h-5 w-5" />,
    tags: ["REST", "Proxy", "Auth"],
  },
  {
    title: "Supabase Postgres",
    desc: "Lưu trữ dữ liệu địa lý (tỉnh/thành, trạm), thống kê, cấu hình map layer.",
    icon: <Database className="h-5 w-5" />,
    tags: ["Postgres", "SQL"],
  },
  {
    title: "Visualization (Apache Echarts)",
    desc: "Biểu đồ so sánh, xu hướng khí tượng, thống kê truy cập.",
    icon: <BarChart3 className="h-5 w-5" />,
    tags: ["Charts", "Analytics", "Dashboard"],
  },
];

const FEATURES: FeatureItem[] = [
  {
    title: "Bản đồ thời tiết",
    desc: "Xem các lớp nhiệt độ, mây, mưa, gió, độ ẩm.",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    title: "Dự báo theo giờ & theo ngày",
    desc: "Xem dữ liệu chi tiết theo khu vực. Biểu đồ trực quan, dễ so sánh.",
    icon: <Gauge className="h-5 w-5" />,
  },
  {
    title: "Tìm kiếm khu vực nhanh",
    desc: "Tìm tỉnh/thành, zoom tới centroid.",
    icon: <MapPin className="h-5 w-5" />,
  },
  {
    title: "Xu hướng thời tiết",
    desc: "Phát hiện xu hướng nóng/lạnh, mưa tăng/giảm… dựa trên dữ liệu tổng hợp.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Admin quản trị dữ liệu",
    desc: "Quản lý users, map layers, thống kê truy cập; workflow rõ ràng, dễ mở rộng.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "Hiệu năng & mở rộng",
    desc: "Cache + proxy API; tối ưu request; sẵn sàng mở rộng nguồn dữ liệu/tiles.",
    icon: <GitBranch className="h-5 w-5" />,
  },
];

function SectionTitle({
  eyebrow,
  title,
  desc,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="space-y-2">
      {eyebrow ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
          <Globe className="h-4 w-4" />
          <span>{eyebrow}</span>
        </div>
      ) : null}
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      {desc ? <p className="max-w-3xl text-sm text-white/70 sm:text-base">{desc}</p> : null}
    </div>
  );
}

function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur",
        "transition hover:border-white/15 hover:bg-white/[0.06]",
        className
      )}
    >
      {children}
    </div>
  );
}

export default function WebGISIntroPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] p-6 sm:p-10">
        <div className="absolute inset-0 -z-10 opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_55%)]">
          <div className="h-full w-full bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.20),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.18),transparent_45%),radial-gradient(circle_at_40%_90%,rgba(34,197,94,0.12),transparent_45%)]" />
        </div>

        <div className="flex flex-col gap-6 sm:gap-8">
          <div className="flex flex-col gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/80">
              <Globe className="h-4 w-4" />
              <span>Weather WebGIS</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
              NỀN TẢNG WEBGIS VỀ THỜI TIẾT: Bản đồ tương tác - Dự báo - Phân tích xu hướng
            </h1>

            <p className="max-w-3xl text-sm text-white/70 sm:text-base">
              WebGIS giúp bạn xem lớp thời tiết trực quan trên bản đồ Việt Nam, tra cứu nhanh theo khu vực,
              theo dõi dự báo theo giờ/ngày và phân tích xu hướng (Trends) dựa trên dữ liệu từ Open-Meteo
              và các nguồn tiles thời tiết.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card>
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold">Layer-based WebGIS</div>
                  <div className="text-xs text-white/70">
                    Tích hợp tile layer từ RainViewer để lấy radar mưa, bản đồ nền từ OpenStreetMap.
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                  <CloudSun className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold">Forecast & Trends</div>
                  <div className="text-xs text-white/70">
                    Dự báo 7-16 ngày, theo giờ, và thẻ xu hướng/cảnh báo trực quan.
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                  <Database className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold">Data Hub</div>
                  <div className="text-xs text-white/70">
                    Lưu trữ dữ liệu địa lý và cấu hình layer trong Supabase/Postgres.
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/discover/overview"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-white/90"
            >
              Xem Dự Báo Tổng Quan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* STACK */}
      <section className="mt-10 space-y-5">
        <SectionTitle
          eyebrow="Tech Stack"
          title="CÔNG NGHỆ SỬ DỤNG"
          desc="Các thành phần chính tạo nên hệ thống WebGIS thời tiết."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STACK.map((it) => (
            <Card key={it.title}>
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-2">{it.icon}</div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="text-sm font-semibold">{it.title}</div>
                  <p className="text-xs text-white/70">{it.desc}</p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {it.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[11px] text-white/75"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mt-10 space-y-5">
        <SectionTitle
          eyebrow="Product"
          title="TÍNH NĂNG NỔI BẬT"
          desc="Những điểm chính mà người dùng và admin sẽ thấy trong hệ thống."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-2">{f.icon}</div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold">{f.title}</div>
                  <p className="text-xs text-white/70">{f.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FOOTER NOTE */}
      <div className="mt-10 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Weather WebGIS • Built with Next.js • Django • Supabase • PostgreSQL
      </div>
    </main>
  );
}
