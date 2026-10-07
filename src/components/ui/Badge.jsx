import { cx } from "./cx";

const variants = {
  default: "bg-primary-muted text-text-secondary border-border",
  primary: "bg-primary/15 text-primary border-primary/25",
  success: "bg-success/15 text-success border-success/25",
  warning: "bg-warning/15 text-warning border-warning/25",
  danger: "bg-danger/15 text-danger border-danger/25",
  info: "bg-info/15 text-info border-info/25",
};

/**
 * Core Badge — semantic status variants.
 */
export default function Badge({
  variant = "default",
  className,
  children,
  ...props
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5",
        "font-sans text-caption whitespace-nowrap",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
