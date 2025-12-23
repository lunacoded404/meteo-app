// src/components/discover/overview/OverviewFloatingPanel.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SunMedium,
  Clock3,
  LayoutList,
  Map,
  CalendarDays,
  TrendingUp,
  Newspaper,
  ArrowUp,
  RotateCcw,
} from "lucide-react";

type ItemKey =
  | "current"
  | "hourly"
  | "details"
  | "maps"
  | "monthly"
  | "trends"
  | "news";

type NavItem = {
  key: ItemKey;
  label: string;
  icon: React.ReactNode;
  hrefHash: `#${ItemKey}`;
};

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export default function OverviewFloatingPanel() {
  const pathname = usePathname();

  const items: NavItem[] = useMemo(
    () => [
      { key: "current", label: "Current", icon: <SunMedium className="h-4 w-4" />, hrefHash: "#current" },
      { key: "hourly", label: "Hourly", icon: <Clock3 className="h-4 w-4" />, hrefHash: "#hourly" },
      { key: "details", label: "Details", icon: <LayoutList className="h-4 w-4" />, hrefHash: "#details" },
      { key: "maps", label: "Maps", icon: <Map className="h-4 w-4" />, hrefHash: "#maps" },
      { key: "monthly", label: "Monthly", icon: <CalendarDays className="h-4 w-4" />, hrefHash: "#monthly" },
      { key: "trends", label: "Trends", icon: <TrendingUp className="h-4 w-4" />, hrefHash: "#trends" },
      { key: "news", label: "News", icon: <Newspaper className="h-4 w-4" />, hrefHash: "#news" },
    ],
    []
  );

  const [active, setActive] = useState<ItemKey>("current");

  // 1) Active theo hash nếu có
  useEffect(() => {
    const onHash = () => {
      const h = (window.location.hash || "#current").replace("#", "") as ItemKey;
      if (items.some((it) => it.key === h)) setActive(h);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [items]);

  // 2) Active theo section đang visible (khi scroll)
  useEffect(() => {
    const sectionEls = items
      .map((it) => document.getElementById(it.key))
      .filter(Boolean) as HTMLElement[];
    if (!sectionEls.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        // chọn entry có intersectionRatio cao nhất
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (!visible?.target?.id) return;

        const id = visible.target.id as ItemKey;
        // Nếu user đang dùng hash, vẫn sync active cho đẹp
        setActive(id);
      },
      {
        root: null,
        threshold: [0.15, 0.25, 0.35, 0.5, 0.65],
        rootMargin: "-20% 0px -55% 0px", // ưu tiên section ở gần đầu viewport
      }
    );

    sectionEls.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items, pathname]);

  const baseHref = "/discover/overview";

  return (
    <aside
      className={cx(
        "fixed left-4 top-1/2 -translate-y-1/2 z-50",
        "w-[176px] select-none"
      )}
      aria-label="Overview navigation"
    >
      <div
        className={cx(
          "rounded-[28px] px-3 py-3",
          "bg-white/10 backdrop-blur-xl",
          "border border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
        )}
      >
        <nav className="flex flex-col gap-1">
          {items.map((it) => {
            const isActive = it.key === active;
            return (
              <Link
                key={it.key}
                href={`${baseHref}${it.hrefHash}`}
                scroll={true}
                className={cx(
                  "flex items-center gap-3",
                  "rounded-full px-3 py-2",
                  "transition-colors",
                  isActive
                    ? "bg-[#FFD84D] text-slate-900"
                    : "text-white/90 hover:bg-white/10"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={cx(
                    "grid place-items-center",
                    "h-8 w-8 rounded-full",
                    isActive ? "bg-white/35" : "bg-white/10"
                  )}
                  aria-hidden="true"
                >
                  {it.icon}
                </span>

                <span className={cx("text-[14px] font-semibold", !isActive && "font-medium")}>
                  {it.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="my-3 h-px w-full bg-white/10" />

        <div className="flex items-center justify-between px-2 pb-1">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={cx(
              "grid place-items-center",
              "h-10 w-10 rounded-full",
              "bg-white/10 text-white/90 hover:bg-white/15",
              "transition-colors"
            )}
            aria-label="Scroll to top"
            title="Lên đầu"
          >
            <ArrowUp className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className={cx(
              "grid place-items-center",
              "h-10 w-10 rounded-full",
              "bg-white/10 text-white/90 hover:bg-white/15",
              "transition-colors"
            )}
            aria-label="Reload"
            title="Tải lại"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
