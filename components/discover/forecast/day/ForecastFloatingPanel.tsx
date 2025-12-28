"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Thermometer, Droplets, Wind, Cloud, Umbrella, ArrowUp, RefreshCw } from "lucide-react";

type NavItem = { id: string; label: string; icon: React.ReactNode };

export function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

// ✅ scroll chính xác: top = elementTop - offsetPx (để không bị sticky bar che)
function scrollToId(id: string, offsetPx: number) {
  const el = document.getElementById(id);
  if (!el) return;

  const top = el.getBoundingClientRect().top + window.scrollY - offsetPx;
  window.scrollTo({ top, behavior: "smooth" });
}

export default function ForecastFloatingPanel({
  topOffsetPx = 110,
  activeOffsetPx = 120,
  items,
  defaultActiveId = "temp",
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
            { id: "temp", label: "Nhiệt độ", icon: <Thermometer className="h-4 w-4" /> },
            { id: "humidity", label: "Độ ẩm", icon: <Droplets className="h-4 w-4" /> },
            { id: "wind", label: "Gió", icon: <Wind className="h-4 w-4" /> },
            { id: "cloud", label: "Mây", icon: <Cloud className="h-4 w-4" /> },
            { id: "rain", label: "Mưa", icon: <Umbrella className="h-4 w-4" /> },
          ],
    [items]
  );

  const [active, setActive] = useState(defaultActiveId);

  // ✅ chặn IO giật active/hash trong lúc click-scroll
  const clickScrollingRef = useRef(false);

// ✅ vào trang: set active + scroll tới section đầu tiên, KHÓA IO lúc đầu để khỏi nhảy
useEffect(() => {
  const hash = (window.location.hash || "").replace("#", "");
  const startId = navItems.some((x) => x.id === hash) ? hash : defaultActiveId;

  setActive(startId);

  // ✅ khóa IO lúc init (vì chart/section render trễ)
  clickScrollingRef.current = true;

  let cancelled = false;

  const tryScroll = (attempt = 0) => {
    if (cancelled) return;

    const el = document.getElementById(startId);
    if (el) {
      // sync hash (không tạo history mới khi init)
      if (window.location.hash !== `#${startId}`) {
        window.history.replaceState(null, "", `#${startId}`);
      }

      scrollToId(startId, activeOffsetPx);

      window.setTimeout(() => {
        if (!cancelled) clickScrollingRef.current = false;
      }, 700);
      return;
    }

    // ✅ retry tối đa ~30 frame (0.5s) để chờ Daily7Charts render id
    if (attempt < 30) {
      requestAnimationFrame(() => tryScroll(attempt + 1));
    } else {
      clickScrollingRef.current = false; // tránh bị khóa vĩnh viễn
    }
  };

  // bắt đầu retry
  requestAnimationFrame(() => tryScroll(0));

  return () => {
    cancelled = true;
    clickScrollingRef.current = false;
  };
}, [navItems, activeOffsetPx, defaultActiveId]);


  // ✅ Active theo section visible khi scroll
  useEffect(() => {
    const ids = navItems.map((x) => x.id);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (clickScrollingRef.current) return;

        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        const id = visible?.target?.id;
        if (!id) return;

        setActive(id);
        if (window.location.hash !== `#${id}`) {
          window.history.replaceState(null, "", `#${id}`);
        }
      },
      {
        root: null,
        // ✅ trừ đúng phần sticky top bar
        rootMargin: `-${activeOffsetPx}px 0px -60% 0px`,
        threshold: [0.08, 0.15, 0.25, 0.35],
      }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [navItems, activeOffsetPx]);

  const jumpTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;

    setActive(id);

    // ✅ tạo history để share link
    if (window.location.hash !== `#${id}`) {
      window.history.pushState(null, "", `#${id}`);
    }

    clickScrollingRef.current = true;
    scrollToId(id, activeOffsetPx);

    window.setTimeout(() => {
      clickScrollingRef.current = false;
    }, 600);
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
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
