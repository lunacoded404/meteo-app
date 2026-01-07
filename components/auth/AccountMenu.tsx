"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { User, ChevronDown, LogIn, UserPlus, LogOut } from "lucide-react";

type SessionState = {
  authenticated: boolean;
  username: string | null;
};

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export default function AccountMenu() {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [session, setSession] = useState<SessionState>({
    authenticated: false,
    username: null,
  });

  const ref = useRef<HTMLDivElement | null>(null);

  // ✅ Fetch session (1 lần) + refetch khi đổi route (login/logout chuyển trang sẽ cập nhật)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingSession(true);
        const r = await fetch("/api/auth/session", { cache: "no-store" });
        const j = (await r.json().catch(() => null)) as SessionState | null;

        if (!alive) return;

        if (j && typeof j.authenticated === "boolean") {
          setSession(j);
        } else {
          setSession({ authenticated: false, username: null });
        }
      } catch {
        if (!alive) return;
        setSession({ authenticated: false, username: null });
      } finally {
        if (!alive) return;
        setLoadingSession(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [pathname]);

  // ✅ close khi click outside / ESC
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    } finally {
      setSession({ authenticated: false, username: null });
      setOpen(false);
      router.push("/home");
      router.refresh();
    }
  };

  const title = useMemo(() => {
    if (loadingSession) return "…";
    if (session.authenticated) return session.username?.trim() || "User";
    return "Tài khoản";
  }, [loadingSession, session.authenticated, session.username]);

  // ✅ chữ cái đầu trên icon
  const initial = useMemo(() => {
    if (!session.authenticated) return null;
    const u = (session.username || "").trim();
    if (!u) return null;
    return u.charAt(0).toUpperCase();
  }, [session.authenticated, session.username]);

  return (
    // ✅ căn giữa theo chiều dọc thanh Header (cao 60px)
    <div className="relative h-[60px] flex items-center" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(
            "inline-flex items-center gap-2 rounded-full",
            "bg-white",
            "px-2.5 py-2 max-[420px]:px-2 max-[420px]:py-1.5",
            "backdrop-blur-md",
            "hover:bg-black/15 transition",
            "focus:outline-none focus:ring-2 focus:ring-black/15"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        title={title}
      >
        <span
          className={cx("grid place-items-center h-9 w-9 rounded-full", "bg-black/10")}
          aria-hidden="true"
        >
          {initial ? (
            <span className="text-[13px] font-extrabold text-black/70">{initial}</span>
          ) : (
            <User className="h-4 w-4 text-black/70" />
          )}
        </span>

        <span className="hidden md:inline text-[13px] font-semibold text-black/80 max-w-[150px] truncate">
          {title}
        </span>

        <ChevronDown
          className={cx(
            "h-4 w-4 text-black/50 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown */}
      <div
        className={cx(
          "absolute top-full right-0 mt-2 w-[240px] origin-top-right z-[100]",
          "transition duration-150",
          open
            ? "scale-100 opacity-100 translate-y-0 pointer-events-auto"
            : "scale-95 opacity-0 -translate-y-1 pointer-events-none"
        )}
      >
        {/* caret */}
        <div className="absolute right-6 -top-2 h-4 w-4 rotate-45 rounded-[4px] bg-white/95 shadow-sm" />

        <div
          className={cx(
            "overflow-hidden rounded-2xl",
            "bg-white/95",
            "shadow-[0_18px_50px_rgba(0,0,0,0.18)]",
            "backdrop-blur-xl"
          )}
          role="menu"
        >
          {session.authenticated ? (
            <>
              <div className="px-4 py-3 border-b border-black/10">
                <div className="mt-0.5 text-[13px] font-semibold text-black truncate">
                  {session.username ?? "User"}
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className={cx(
                  "w-full px-4 py-3 text-left",
                  "text-[13px] font-semibold text-black/80",
                  "hover:bg-black/[0.04] active:bg-black/[0.06]",
                  "flex items-center gap-2",
                  "focus:outline-none focus:bg-black/[0.05]"
                )}
                role="menuitem"
              >
                <span className="grid place-items-center h-8 w-8 rounded-xl bg-black/5">
                  <LogOut className="h-4 w-4 text-black/70" />
                </span>
                Logout
              </button>
            </>
          ) : (
            <div className="p-2">
              <Link
                href="/discover/login"
                onClick={() => setOpen(false)}
                className={cx(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl",
                  "hover:bg-black/[0.04] active:bg-black/[0.06]",
                  "text-[13px] font-semibold text-black/80",
                  "focus:outline-none focus:bg-black/[0.05]"
                )}
                role="menuitem"
              >
                <span className="grid place-items-center h-8 w-8 rounded-xl bg-black/5">
                  <LogIn className="h-4 w-4 text-black/70" />
                </span>
                Đăng Nhập
              </Link>

              <Link
                href="/discover/signin"
                onClick={() => setOpen(false)}
                className={cx(
                  "mt-1 flex items-center gap-2 px-3 py-2.5 rounded-xl",
                  "hover:bg-black/[0.04] active:bg-black/[0.06]",
                  "text-[13px] font-semibold text-black/80",
                  "focus:outline-none focus:bg-black/[0.05]"
                )}
                role="menuitem"
              >
                <span className="grid place-items-center h-8 w-8 rounded-xl bg-black/5">
                  <UserPlus className="h-4 w-4 text-black/70" />
                </span>
                Đăng Ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
