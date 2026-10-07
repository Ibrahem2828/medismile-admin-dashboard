"use client";

import { forwardRef } from "react";
import { cx } from "./cx";

const base =
  "font-sans text-body-sm rounded-md " +
  "bg-surface text-text border border-border " +
  "placeholder:text-muted " +
  "transition-colors " +
  "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/25 " +
  "disabled:opacity-50 disabled:pointer-events-none disabled:bg-background";

const sizes = {
  md: "h-10 px-3",
  compact: "h-9 px-3 text-caption",
};

/**
 * Core Input — semantic surface/border/text/muted/ring/danger.
 */
const Input = forwardRef(function Input(
  {
    error = false,
    fullWidth = true,
    size = "md",
    className,
    ...props
  },
  ref
) {
  return (
    <input
      ref={ref}
      aria-invalid={error || undefined}
      className={cx(
        base,
        sizes[size] || sizes.md,
        fullWidth ? "w-full" : "w-auto",
        error && "border-danger focus:border-danger focus:ring-danger/25",
        className
      )}
      {...props}
    />
  );
});

export default Input;
