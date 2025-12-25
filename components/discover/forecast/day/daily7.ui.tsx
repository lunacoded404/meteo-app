import React from "react";

export function TableShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="border-b border-white/10 px-4 py-2 text-[13px] font-semibold text-white/90">{title}</div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 text-left text-[12px] font-medium text-slate-300">{children}</th>;
}

export function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2 text-[13px] text-slate-100">{children}</td>;
}

/** ✅ Có id để ForecastFloatingPanel nhảy; scroll margin top để không bị Header che */
export function SectionCard({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      style={{ scrollMarginTop: "var(--fp-offset, 120px)" }}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
    >
      <div>
        <div className="text-[14px] font-semibold text-white">{title}</div>
        {subtitle ? <div className="mt-0.5 text-[12px] text-slate-300">{subtitle}</div> : null}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}
