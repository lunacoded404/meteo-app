import React from "react";

export function wmoKind(code?: number | null) {
  const c = code ?? -1;
  if (c === 0) return "clear";
  if (c >= 1 && c <= 3) return "partly";
  if (c === 45 || c === 48) return "fog";
  if (c >= 51 && c <= 57) return "drizzle";
  if ((c >= 61 && c <= 67) || (c >= 80 && c <= 82)) return "rain";
  if (c >= 71 && c <= 77) return "snow";
  if (c === 95 || c === 96 || c === 99) return "thunder";
  return "cloudy";
}

export default function WmoIcon({ code, className }: { code?: number | null; className?: string }) {
  const kind = wmoKind(code);

  const common = {
    viewBox: "0 0 64 64",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className,
  } as any;

  if (kind === "clear") {
    return (
      <svg {...common}>
        <circle cx="32" cy="32" r="10" fill="currentColor" opacity="0.9" />
        <g stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.65">
          <path d="M32 6v8" />
          <path d="M32 50v8" />
          <path d="M6 32h8" />
          <path d="M50 32h8" />
          <path d="M13 13l6 6" />
          <path d="M45 45l6 6" />
          <path d="M51 13l-6 6" />
          <path d="M19 45l-6 6" />
        </g>
      </svg>
    );
  }

  if (kind === "cloudy" || kind === "partly") {
    return (
      <svg {...common}>
        {kind === "partly" && <circle cx="22" cy="22" r="8" fill="currentColor" opacity="0.55" />}
        <path
          d="M24 44h22c6 0 10-4 10-9s-4-9-10-9c-1 0-2 0-3 .3C41 20 36 16 30 16c-7 0-12 5-13 12C11 29 8 33 8 38c0 6 5 6 16 6z"
          fill="currentColor"
          opacity="0.85"
        />
      </svg>
    );
  }

  if (kind === "fog") {
    return (
      <svg {...common}>
        <path
          d="M20 30h26c6 0 10-4 10-9s-4-9-10-9c-1 0-2 0-3 .3C41 6 36 2 30 2 23 2 18 7 17 14 11 15 8 19 8 24c0 6 5 6 12 6z"
          fill="currentColor"
          opacity="0.75"
        />
        <g stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.5">
          <path d="M12 44h40" />
          <path d="M16 52h32" />
          <path d="M20 60h24" />
        </g>
      </svg>
    );
  }

  if (kind === "drizzle" || kind === "rain") {
    return (
      <svg {...common}>
        <path
          d="M22 36h24c6 0 10-4 10-9s-4-9-10-9c-1 0-2 0-3 .3C41 12 36 8 30 8c-7 0-12 5-13 12C11 21 8 25 8 30c0 6 5 6 14 6z"
          fill="currentColor"
          opacity="0.85"
        />
        <g
          stroke="currentColor"
          strokeWidth={kind === "drizzle" ? 3 : 4}
          strokeLinecap="round"
          opacity={kind === "drizzle" ? 0.55 : 0.7}
        >
          <path d="M22 46l-3 8" />
          <path d="M34 46l-3 8" />
          <path d="M46 46l-3 8" />
          {kind === "rain" && <path d="M28 54l-3 8" />}
        </g>
      </svg>
    );
  }

  if (kind === "snow") {
    return (
      <svg {...common}>
        <path
          d="M22 36h24c6 0 10-4 10-9s-4-9-10-9c-1 0-2 0-3 .3C41 12 36 8 30 8c-7 0-12 5-13 12C11 21 8 25 8 30c0 6 5 6 14 6z"
          fill="currentColor"
          opacity="0.85"
        />
        <g fill="currentColor" opacity="0.7">
          <circle cx="22" cy="52" r="2.2" />
          <circle cx="34" cy="52" r="2.2" />
          <circle cx="46" cy="52" r="2.2" />
          <circle cx="28" cy="58" r="2.2" />
          <circle cx="40" cy="58" r="2.2" />
        </g>
      </svg>
    );
  }

  // thunder
  return (
    <svg {...common}>
      <path
        d="M22 36h24c6 0 10-4 10-9s-4-9-10-9c-1 0-2 0-3 .3C41 12 36 8 30 8c-7 0-12 5-13 12C11 21 8 25 8 30c0 6 5 6 14 6z"
        fill="currentColor"
        opacity="0.85"
      />
      <path d="M30 44l-6 12h8l-4 10 14-18h-9l5-4z" fill="currentColor" opacity="0.75" />
    </svg>
  );
}
