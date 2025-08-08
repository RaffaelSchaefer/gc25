"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SegmentedOption = {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
};

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  "aria-label"?: string;
}

const sizes = {
  sm: {
    height: "h-8",
    padding: "p-0.5",
    tab: "text-xs px-2",
    indicator: "rounded-md",
  },
  md: {
    height: "h-9",
    padding: "p-1",
    tab: "text-sm px-3",
    indicator: "rounded-lg",
  },
  lg: {
    height: "h-10",
    padding: "p-1",
    tab: "text-sm px-4",
    indicator: "rounded-lg",
  },
};

export function SegmentedControl({
  options,
  value,
  onChange,
  size = "md",
  className,
  "aria-label": ariaLabel = "Segmented control",
}: SegmentedControlProps) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const ref = React.useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] =
    React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    if (!ref.current) return;
    const children = Array.from(
      ref.current.querySelectorAll("[data-segmented-option]"),
    ) as HTMLButtonElement[];
    const el = children[selectedIndex];
    if (el) {
      const { offsetLeft, offsetWidth } = el;
      setIndicatorStyle({
        transform: `translateX(${offsetLeft}px)`,
        width: offsetWidth,
      });
    }
  }, [selectedIndex, options, value]);

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center rounded-xl bg-muted text-muted-foreground",
        "border border-border",
        sizes[size].height,
        sizes[size].padding,
        "relative",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "absolute top-1 bottom-1 left-1 transition-transform duration-200 ease-out bg-background shadow-sm",
          sizes[size].indicator,
        )}
        style={indicatorStyle}
      />

      <div ref={ref} className="relative flex w-full">
        {options.map((opt, i) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              role="tab"
              aria-selected={isSelected}
              aria-label={
                opt.ariaLabel ||
                (typeof opt.label === "string" ? opt.label : undefined)
              }
              data-segmented-option
              disabled={opt.disabled}
              className={cn(
                "relative z-10 inline-flex items-center gap-2 rounded-lg transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                sizes[size].tab,
                "h-full",
                isSelected ? "text-foreground" : "text-muted-foreground",
              )}
              onClick={() => !opt.disabled && onChange(opt.value)}
            >
              {opt.icon}
              <span className="whitespace-nowrap">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SegmentedControl;
