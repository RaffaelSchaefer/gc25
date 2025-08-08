"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: "default" | "primary" | "success" | "warning" | "destructive";
  variant?: "solid" | "soft" | "outline";
  size?: "sm" | "md";
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onRemove?: () => void;
  removable?: boolean;
  selected?: boolean;
}

const base =
  "inline-flex items-center gap-1 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const sizes = {
  sm: "text-xs h-6 px-2",
  md: "text-sm h-7 px-3",
};

const colorTokens = {
  default: {
    solid: "bg-muted text-foreground border-transparent",
    soft: "bg-muted/60 text-foreground border-border",
    outline: "bg-background text-foreground border-border",
  },
  primary: {
    solid: "bg-primary text-primary-foreground border-transparent",
    soft: "bg-primary/15 text-primary border-primary/30",
    outline: "bg-background text-primary border-primary/40",
  },
  success: {
    solid: "bg-emerald-500 text-white border-transparent",
    soft: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    outline: "bg-background text-emerald-600 border-emerald-500/40",
  },
  warning: {
    solid: "bg-amber-500 text-white border-transparent",
    soft: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    outline: "bg-background text-amber-700 border-amber-500/40",
  },
  destructive: {
    solid: "bg-red-500 text-white border-transparent",
    soft: "bg-red-500/15 text-red-600 border-red-500/30",
    outline: "bg-background text-red-600 border-red-500/40",
  },
};

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  {
    color = "default",
    variant = "soft",
    size = "md",
    className,
    leadingIcon,
    trailingIcon,
    onRemove,
    removable,
    selected = false,
    ...props
  },
  ref,
) {
  const colorClass = colorTokens[color][variant];

  return (
    <span
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn(
        base,
        sizes[size],
        colorClass,
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        className,
      )}
      {...props}
    >
      {leadingIcon ? <span className="shrink-0">{leadingIcon}</span> : null}
      <span className="truncate">{props.children}</span>
      {trailingIcon ? <span className="shrink-0">{trailingIcon}</span> : null}
      {removable && (
        <button
          type="button"
          aria-label="Remove"
          className={cn(
            "ml-1 inline-flex size-5 items-center justify-center rounded-full",
            "hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          onClick={onRemove}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
});

export default Chip;
