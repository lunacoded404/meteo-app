"use client";

import React from "react";

export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-[14px] font-semibold text-slate-900 leading-snug break-words">
        {value}
      </div>
      {sub ? <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div> : null}
    </div>
  );
}

export default function PopupCard({
  icon,
  title,
  timeText,
  description,
  loading,
  error,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  timeText?: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="w-[320px] max-w-[78vw] px-4 py-3 text-slate-900">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-slate-50 border border-slate-200 p-2 shrink-0">
          <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold leading-tight truncate">{title}</div>

          {timeText ? (
            <div className="mt-0.5 text-[11px] text-slate-500 break-words">{timeText}</div>
          ) : null}

          {description ? (
            <div className="mt-2 text-[12px] text-slate-600 whitespace-normal break-words">
              {description}
            </div>
          ) : null}

          <div className="mt-3">
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-[12px] text-slate-600 whitespace-normal break-words">
                  Đang tải dữ liệu...
                </div>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <div className="text-[12px] text-rose-700 whitespace-normal break-words">
                  {error}
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
