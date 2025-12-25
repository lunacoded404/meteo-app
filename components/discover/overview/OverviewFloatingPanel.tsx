"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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

type ItemKey = "current" | "hourly" | "details" | "maps" | "monthly" | "trends";

type NavItem = {
  key: ItemKey;
  label: string;
  icon: React.ReactNode;
};

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

/**
 * Header offset để scroll đúng vị trí (vì bạn có <div className="h-[108px]" /> và scroll-mt-28)
 * 28 = 7rem = 112px gần đúng, mình dùng 112 cho chắc.
 */
const SCROLL_OFFSET = 112;

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
}

export default function OverviewFloatingPanel() {
  const items: NavItem[] = useMemo(
    () => [
      { key: "current", label: "Hiện Tại", icon: <SunMedium className="h-4 w-4" /> },
      { key: "hourly", label: "Theo Giờ", icon: <Clock3 className="h-4 w-4" /> },
      { key: "details", label: "Chi Tiết", icon: <LayoutList className="h-4 w-4" /> },
      { key: "maps", label: "Bản đồ", icon: <Map className="h-4 w-4" /> },
      { key: "monthly", label: "Theo ngày", icon: <CalendarDays className="h-4 w-4" /> },
      { key: "trends", label: "Xu hướng", icon: <TrendingUp className="h-4 w-4" /> },
    ],
    []
  );

  const [active, setActive] = useState<ItemKey>("current");
  const clickScrollingRef = useRef(false);

  // 1) vào trang có #hash -> scroll đúng section
  useEffect(() => {
    const h = (window.location.hash || "#current").replace("#", "") as ItemKey;
    if (items.some((it) => it.key === h)) {
      setActive(h);
      // delay 1 tick để DOM render xong
      setTimeout(() => scrollToId(h), 0);
    }
  }, [items]);

  // 2) Active theo section visible khi scroll
  useEffect(() => {
    const sectionEls = items
      .map((it) => document.getElementById(it.key))
      .filter(Boolean) as HTMLElement[];

    if (!sectionEls.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        // Nếu đang click-scroll, đừng để IO giật active/hash
        if (clickScrollingRef.current) return;

        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        const id = visible?.target?.id as ItemKey | undefined;
        if (!id) return;

        setActive(id);

        // sync hash (không tạo history mới)
        if (window.location.hash !== `#${id}`) {
          window.history.replaceState(null, "", `#${id}`);
        }
      },
      {
        root: null,
        threshold: [0.15, 0.25, 0.35, 0.5, 0.65],
        rootMargin: "-20% 0px -55% 0px",
      }
    );

    sectionEls.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  const onPick = (key: ItemKey) => {
    // đảm bảo key tồn tại trong DOM
    const el = document.getElementById(key);
    if (!el) return;

    setActive(key);

    // tạo history để share link
    if (window.location.hash !== `#${key}`) {
      window.history.pushState(null, "", `#${key}`);
    }

    // chặn IO trong lúc scroll smooth
    clickScrollingRef.current = true;
    scrollToId(key);

    // thả sau 600ms (đủ cho smooth scroll)
    window.setTimeout(() => {
      clickScrollingRef.current = false;
    }, 600);
  };

  return (
    <aside className={cx("fixed left-4 top-1/2 -translate-y-1/2 z-50", "w-[176px] select-none")}>
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
              <button
                key={it.key}
                type="button"
                onClick={() => onPick(it.key)}
                className={cx(
                  "flex items-center gap-3 w-full text-left",
                  "rounded-full px-3 py-2",
                  "transition-colors",
                  isActive ? "bg-[#FFD84D] text-slate-900" : "text-white/90 hover:bg-white/10"
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
              </button>
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
