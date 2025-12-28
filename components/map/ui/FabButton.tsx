"use client";

import React from "react";

export default function FabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition",
        active ? "bg-white text-slate-900" : "bg-slate-800/60 text-slate-100 hover:bg-slate-700/70",
      ].join(" ")}
      type="button"
    >
      <span className="inline-flex items-center justify-center">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
