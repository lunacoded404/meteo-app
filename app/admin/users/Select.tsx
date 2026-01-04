"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";

export function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export function Select({
  value,
  onValueChange,
  placeholder,
  items,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  items: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        className={cx(
          "inline-flex w-full items-center justify-between gap-2",
          "rounded-xl border px-3 py-2.5 outline-none",
          // ✅ cùng style với Input của bạn
          "bg-white/5 text-white border-white/10",
          "focus:border-white/20 focus:bg-white/7",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder ?? "Chọn..."} />
        <SelectPrimitive.Icon className="text-white/60">
          <ChevronDown className="h-4 w-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className={cx(
            "z-50 overflow-hidden rounded-xl border shadow-xl",
            // ✅ dropdown cùng màu input
            "border-white/10 bg-[#0b1020] text-white"
          )}
        >
          <SelectPrimitive.Viewport className="p-1">
            {items.map((it) => (
              <SelectPrimitive.Item
                key={it.value}
                value={it.value}
                className={cx(
                  "relative flex cursor-pointer select-none items-center gap-2",
                  "rounded-lg px-3 py-2 text-sm outline-none",
                  "text-white/85 hover:bg-white/10",
                  "data-[highlighted]:bg-white/10",
                  "data-[state=checked]:bg-white/10"
                )}
              >
                <SelectPrimitive.ItemIndicator className="absolute right-2 inline-flex items-center">
                  <Check className="h-4 w-4 text-emerald-300" />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{it.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
