"use client";

import { useEffect, useId } from "react";
import { X } from "lucide-react";
import { cx } from "./cx";

/**
 * Core Modal — matches existing app pattern (fixed overlay + centered panel).
 * Controlled: open + onClose. Does not change page-level modal call sites yet.
 */
export default function Modal({
  open = false,
  onClose,
  title,
  children,
  className,
  panelClassName,
  showClose = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  zIndexClass = "z-[70]",
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open || !closeOnEscape) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeOnEscape, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={cx(
        "fixed inset-0 flex items-center justify-center p-4",
        "bg-black/50",
        zIndexClass
      )}
      role="presentation"
      onClick={() => {
        if (closeOnBackdrop) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cx(
          "w-full max-w-lg max-h-[90vh] overflow-y-auto",
          "bg-surface text-text border border-border",
          "rounded-xl shadow-xl",
          "p-5 sm:p-6",
          panelClassName,
          className
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {(title || showClose) && (
          <div className="mb-4 flex items-start justify-between gap-3">
            {title ? (
              <h2 id={titleId} className="text-h2 text-text m-0">
                {title}
              </h2>
            ) : (
              <span />
            )}
            {showClose ? (
              <button
                type="button"
                onClick={() => onClose?.()}
                className={cx(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center",
                  "rounded-md text-muted hover:bg-primary-muted hover:text-text",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                )}
                aria-label="Close"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            ) : null}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
