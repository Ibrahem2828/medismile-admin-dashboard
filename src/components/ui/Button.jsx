"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cx } from "./cx";

const base =
  "inline-flex items-center justify-center gap-2 font-sans " +
  "rounded-md border border-transparent transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const variants = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover",
  secondary:
    "bg-primary-muted text-text border-border hover:bg-primary-muted/80",
  danger:
    "bg-danger text-primary-foreground hover:opacity-90 active:opacity-80",
  ghost: "bg-transparent text-text hover:bg-primary-muted",
  outline:
    "bg-transparent text-text border-border hover:bg-primary-muted",
};

const sizes = {
  sm: "h-9 px-3 text-caption",
  md: "h-10 px-4 text-label",
};

/**
 * Core Button — semantic tokens only (primary / surface / text / danger / ring).
 */
const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    type = "button",
    loading = false,
    disabled = false,
    className,
    children,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cx(
        base,
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : null}
      {children}
    </button>
  );
});

export default Button;
