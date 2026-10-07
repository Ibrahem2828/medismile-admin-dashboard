import { Loader2 } from "lucide-react";
import { cx } from "./cx";

/**
 * DataTable — professional table shell using design tokens.
 * Presentational only; no data/fetching logic.
 */

export function DataTable({
  children,
  className,
  minWidth = "900px",
  dir,
  ...props
}) {
  return (
    <div
      className={cx(
        "overflow-x-auto rounded-lg border border-border bg-surface shadow-sm",
        className
      )}
    >
      <table
        className="w-full border-collapse text-body-sm text-text"
        style={{ minWidth }}
        dir={dir}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function DataTableHead({ children, className, ...props }) {
  return (
    <thead
      className={cx("border-b border-border bg-background", className)}
      {...props}
    >
      {children}
    </thead>
  );
}

export function DataTableTh({ children, className, ...props }) {
  return (
    <th
      scope="col"
      className={cx(
        "px-4 py-3.5 text-caption font-semibold tracking-wide text-muted whitespace-nowrap",
        "first:ps-5 last:pe-5",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function DataTableBody({ children, className, ...props }) {
  return (
    <tbody className={cx("divide-y divide-border", className)} {...props}>
      {children}
    </tbody>
  );
}

export function DataTableRow({
  as: Comp = "tr",
  children,
  className,
  ...props
}) {
  return (
    <Comp
      className={cx(
        "bg-surface transition-colors duration-150",
        "hover:bg-primary-muted/55",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function DataTableTd({ children, className, ...props }) {
  return (
    <td
      className={cx(
        "px-4 py-3.5 align-middle text-text",
        "first:ps-5 last:pe-5",
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

export function DataTableEmpty({ children, className, ...props }) {
  return (
    <div
      className={cx(
        "rounded-lg border border-dashed border-border bg-surface px-6 py-14",
        "text-center text-body-sm text-muted",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DataTableLoading({ className, ...props }) {
  return (
    <div
      className={cx(
        "flex items-center justify-center rounded-lg border border-border bg-surface py-14",
        className
      )}
      {...props}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
    </div>
  );
}

export default DataTable;
