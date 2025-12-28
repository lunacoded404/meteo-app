"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  SunMedium,
  Clock3,
  LayoutList,
  Map,
  CalendarDays,
  TrendingUp,
  ArrowUp,
  RotateCcw,
} from "lucide-react";

type NavItem = { id: string; label: string; icon: React.ReactNode };

export function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export default function OverviewFloatingPanel({
  topOffsetPx = 110,
  activeOffsetPx = 120,
  items,
  defaultActiveId = "current",
  onRefresh,
  className,
}: {
  topOffsetPx?: number;
  activeOffsetPx?: number;
  items?: NavItem[];
  defaultActiveId?: string;
  onRefresh?: () => void;
  className?: string;
}) {
  const navItems: NavItem[] = useMemo(
    () =>
      items?.length
        ? items
        : [
            { id: "current", label: "Hiện tại", icon: <SunMedium className="h-4 w-4" /> },
            { id: "hourly", label: "Theo giờ", icon: <Clock3 className="h-4 w-4" /> },
            { id: "details", label: "Chi tiết", icon: <LayoutList className="h-4 w-4" /> },
            { id: "maps", label: "Bản đồ", icon: <Map className="h-4 w-4" /> },
            { id: "monthly", label: "Theo ngày", icon: <CalendarDays className="h-4 w-4" /> },
            { id: "trends", label: "Xu hướng", icon: <TrendingUp className="h-4 w-4" /> },
          ],
    [items]
  );

  const [active, setActive] = useState(defaultActiveId);

  // ✅ Active theo section visible (giống Hourly)
  useEffect(() => {
    const ids = navItems.map((x) => x.id);

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        const id = visible?.target?.id;
        if (!id) return;

        setActive(id);

        // sync hash (không tạo history mới)
        if (window.location.hash !== `#${id}`) {
          window.history.replaceState(null, "", `#${id}`);
        }
      },
      {
        root: null,
        rootMargin: `-${activeOffsetPx}px 0px -60% 0px`,
        threshold: [0.08, 0.15, 0.25],
      }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });

    return () => obs.disconnect();
  }, [navItems, activeOffsetPx]);

  // ✅ jumpTo giống Hourly
  const jumpTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
    setActive(id);
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const refresh = () => {
    if (onRefresh) return onRefresh();
    window.location.reload();
  };

  const maxHeight = `min(60vh, calc(100vh - ${topOffsetPx + 24}px))`;

  return (
    <div className={cx("hidden lg:block fixed left-5 z-[70]", className)} style={{ top: topOffsetPx }}>
      <div
        className={cx(
          "w-[150px] rounded-[22px] overflow-hidden",
          "border border-white/10 shadow-[0_16px_45px_rgba(0,0,0,0.5)]",
          "bg-gradient-to-b from-slate-700/40 via-slate-800/35 to-slate-900/35",
          "backdrop-blur-xl"
        )}
        style={{ maxHeight }}
      >
        <div className="p-3 flex flex-col gap-2 h-full">
          <div className="flex flex-col gap-2 overflow-auto pr-1">
            {navItems.map((it) => {
              const isActive = it.id === active;

              return (
                <a
                  key={it.id}
                  href={`#${it.id}`}
                  onClick={jumpTo(it.id)}
                  className={cx(
                    "group flex items-center gap-2",
                    "rounded-full px-2.5 py-1.5 transition",
                    isActive ? "bg-[#F7D34C] text-slate-900" : "text-slate-200/90 hover:bg-white/5"
                  )}
                >
                  <span
                    className={cx(
                      "grid place-items-center shrink-0",
                      "h-8 w-8 rounded-full border",
                      isActive
                        ? "bg-[#FBE38A] border-black/10 text-slate-900"
                        : "bg-white/10 border-white/10 text-slate-200 group-hover:bg-white/15"
                    )}
                    aria-hidden="true"
                  >
                    {it.icon}
                  </span>

                  <span
                    className={cx(
                      "text-[13px] font-medium tracking-tight",
                      isActive ? "text-slate-900" : "text-slate-100"
                    )}
                  >
                    {it.label}
                  </span>
                </a>
              );
            })}
          </div>

          <div className="mt-1 border-t border-white/10 pt-2 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={scrollTop}
              className={cx(
                "h-10 w-10 rounded-full",
                "grid place-items-center",
                "border border-white/10 bg-white/5 text-slate-200",
                "hover:bg-white/10 transition"
              )}
              title="Lên đầu trang"
              aria-label="Scroll to top"
            >
              <ArrowUp className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={refresh}
              className={cx(
                "h-10 w-10 rounded-full",
                "grid place-items-center",
                "border border-white/10 bg-white/5 text-slate-200",
                "hover:bg-white/10 transition"
              )}
              title="Tải lại"
              aria-label="Refresh"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
