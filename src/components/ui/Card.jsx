import { forwardRef } from "react";
import { cx } from "./cx";

/**
 * Core Card — surface / border / radius-lg / shadow-sm.
 * Optional elevated uses surface-elevated + shadow-md.
 */
const Card = forwardRef(function Card(
  {
    as: Comp = "div",
    elevated = false,
    padding = true,
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <Comp
      ref={ref}
      className={cx(
        "bg-surface text-text border border-border rounded-lg",
        elevated ? "shadow-md bg-surface-elevated" : "shadow-sm",
        padding && "p-5 sm:p-6",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
});

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cx("mb-4 flex items-start justify-between gap-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cx("text-h3 text-text m-0", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cx("text-body-sm text-text-secondary", className)} {...props}>
      {children}
    </div>
  );
}

export default Card;
